import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { env } from "./config/env";
import {
  clearAuthCookies,
  createAnonSupabaseClient,
  fileExtensionFromMime,
  getAccessTokenFromRequest,
  getRefreshTokenFromRequest,
  parseBase64Image,
  sanitizeUniqueIdForPath,
  setAuthCookies,
  supabaseAdmin,
  uniqueIdToSupabaseEmail,
} from "./supabase-client";

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function canAccessDocument(user: any, doc: any) {
  if (user.role === "Administrator") return true;
  if (user.role === "Lecturer") {
    if (doc.uploadedBy === user.id) return true;
    return doc.status === "Approved" && doc.allowStaffAccess;
  }
  if (user.role === "Student") {
    return doc.status === "Approved" && doc.allowStudentAccess;
  }
  return false;
}

async function getAuthenticatedUser(req: any, res: any) {
  const accessToken = getAccessTokenFromRequest(req);
  const refreshToken = getRefreshTokenFromRequest(req);
  const supabase = createAnonSupabaseClient();

  const resolveByUniqueIdFallback = async (candidate: any) => {
    const uniqueId = candidate?.user_metadata?.uniqueId as string | undefined;
    if (!uniqueId) {
      return undefined;
    }

    return storage.getUserByUniqueId(uniqueId);
  };

  if (accessToken) {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (!error && data.user) {
      const linked = await storage.getUserByAuthUserId(data.user.id);
      if (linked) {
        return linked;
      }

      return resolveByUniqueIdFallback(data.user);
    }
  }

  if (refreshToken) {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });
    if (!error && data.session) {
      setAuthCookies(res, data.session);
      const linked = await storage.getUserByAuthUserId(data.session.user.id);
      if (linked) {
        return linked;
      }

      return resolveByUniqueIdFallback(data.session.user);
    }
  }

  return undefined;
}

async function requireAuth(req: any, res: any) {
  const currentUser = await getAuthenticatedUser(req, res);
  if (!currentUser) {
    res.status(401).json({ message: "Not authenticated" });
    return undefined;
  }

  return currentUser;
}

async function requireRole(req: any, res: any, allowedRoles: string[]) {
  const currentUser = await requireAuth(req, res);
  if (!currentUser) {
    return undefined;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    res
      .status(401)
      .json({ message: "You do not have permission to perform this action." });
    return undefined;
  }

  return currentUser;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // Auth routes
  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      const normalizedUniqueId = input.uniqueId.trim();

      // Check if user exists first (fast DB query)
      const user = await storage.getUserByUniqueId(normalizedUniqueId);

      if (!user) {
        return res
          .status(401)
          .json({ message: "Invalid identifier or password." });
      }

      // Check user status before expensive Supabase auth
      if (user.status !== "Active") {
        return res.status(403).json({
          message:
            "Your account creation is pending admin approval. You will be able to sign in once approved.",
        });
      }

      // Now perform Supabase authentication (slowest operation)
      const supabaseEmail = uniqueIdToSupabaseEmail(normalizedUniqueId);
      const supabase = createAnonSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: supabaseEmail,
        password: input.password,
      });

      if (error || !data.session) {
        return res
          .status(401)
          .json({ message: "Invalid identifier or password." });
      }

      setAuthCookies(res, data.session);

      // Create audit log asynchronously (don't block the response)
      storage.createAuditLog({
        userId: user.id,
        userName: user.name,
        action: "Login",
      }).catch((err) => {
        console.error("Failed to create login audit log:", err);
      });

      // Return response immediately without waiting for audit log
      res.status(200).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.signup.path, async (req, res) => {
    try {
      const input = api.auth.signup.input.parse(req.body);
      const normalizedUniqueId = input.uniqueId.trim();
      const existingUser = await storage.getUserByUniqueId(normalizedUniqueId);
      const role = input.accountType === "Staff" ? "Lecturer" : "Student";

      if (existingUser) {
        return res.status(409).json({
          message:
            "This staff ID or matric number already exists on the platform.",
        });
      }

      const supabaseEmail = uniqueIdToSupabaseEmail(normalizedUniqueId);
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: supabaseEmail,
          password: input.password,
          email_confirm: true,
          user_metadata: {
            uniqueId: normalizedUniqueId,
            accountType: input.accountType,
          },
        });

      if (authError || !authData.user) {
        const message = authError?.message?.toLowerCase().includes("already")
          ? "This staff ID or matric number already exists on the platform."
          : "Unable to create account at the moment.";
        return res.status(409).json({ message });
      }

      const { mime, buffer } = parseBase64Image(input.idCardImage);
      const extension = fileExtensionFromMime(mime);
      const safeIdentifier = sanitizeUniqueIdForPath(normalizedUniqueId);
      const imagePath = `${safeIdentifier}/${Date.now()}.${extension}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from(env.SUPABASE_ID_CARD_BUCKET)
        .upload(imagePath, buffer, {
          contentType: mime,
          upsert: false,
        });

      if (uploadError) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return res
          .status(400)
          .json({ message: "Unable to upload ID card image." });
      }

      const user = await storage.createUser({
        authUserId: authData.user.id,
        uniqueId: normalizedUniqueId,
        password: "SUPABASE_AUTH",
        name: input.name,
        role,
        department: "ICT Engineering",
        level: null,
        idCardImage: imagePath,
        status: "Pending Approval",
      });

      await storage.createAuditLog({
        userId: user.id,
        userName: user.name,
        action: "Account Created",
      });

      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      if (
        err instanceof Error &&
        err.message.includes("SUPABASE_SCHEMA_NOT_READY")
      ) {
        return res.status(503).json({
          message:
            "Supabase schema is not initialized. Run the SQL in supabase/migrations/0001_initial.sql and 0002_policies.sql.",
        });
      }
      console.error("Signup failed:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.logout.path, (req, res) => {
    clearAuthCookies(res);
    res.status(200).json({ success: true });
  });

  app.get(api.auth.me.path, async (req, res) => {
    const user = await getAuthenticatedUser(req, res);
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    res.status(200).json(user);
  });

  // Documents
  app.get(api.documents.list.path, async (req, res) => {
    try {
      const currentUser = await requireAuth(req, res);
      if (!currentUser) return;

      // Validate query params if needed, but keeping it loose for now
      const docs = await storage.getDocuments({
        category: req.query.category as string,
        status: req.query.status as string,
      });

      const visibleDocs = docs.filter((d) => canAccessDocument(currentUser, d));

      res.json(visibleDocs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get(api.documents.get.path, async (req, res) => {
    const currentUser = await requireAuth(req, res);
    if (!currentUser) return;

    const doc = await storage.getDocument(Number(req.params.id));
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (!canAccessDocument(currentUser, doc)) {
      return res
        .status(401)
        .json({ message: "You do not have permission to view this document." });
    }

    res.json(doc);
  });

  app.post(api.documents.create.path, async (req, res) => {
    try {
      const currentUser = await requireRole(req, res, [
        "Administrator",
        "Lecturer",
      ]);
      if (!currentUser) return;

      const input = api.documents.create.input.parse(req.body);
      if (!input.fileData || !input.fileName) {
        return res.status(400).json({
          message: "Document file is required for upload.",
          field: "fileData",
        });
      }

      const { mime, buffer } = parseBase64Image(input.fileData);
      const extension =
        input.fileName.split(".").pop()?.toLowerCase() ||
        fileExtensionFromMime(mime);
      const safeFileName = sanitizeFileName(input.fileName);
      const docPath = `documents/${currentUser.id}/${Date.now()}-${safeFileName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from(env.SUPABASE_DOCUMENT_BUCKET)
        .upload(docPath, buffer, {
          contentType: mime,
          upsert: false,
        });

      if (uploadError) {
        return res.status(400).json({
          message: "Unable to upload document file.",
          field: "fileData",
        });
      }

      const doc = await storage.createDocument({
        title: input.title,
        category: input.category,
        uploadedBy: input.uploadedBy,
        uploadedByName: input.uploadedByName,
        fileType: input.fileType || extension,
        fileName: input.fileName,
        filePath: docPath,
        allowStaffAccess: input.allowStaffAccess ?? true,
        allowStudentAccess: input.allowStudentAccess ?? true,
        size: input.size,
        status: input.status,
        description: input.description ?? null,
      });

      await storage.createAuditLog({
        userId: currentUser.id,
        userName: currentUser.name,
        action: "Upload",
        documentId: doc.id,
        documentTitle: doc.title,
      });

      res.status(201).json(doc);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.documents.downloadUrl.path, async (req, res) => {
    const currentUser = await requireAuth(req, res);
    if (!currentUser) return;

    const doc = await storage.getDocument(Number(req.params.id));
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (!canAccessDocument(currentUser, doc)) {
      return res.status(401).json({
        message: "You do not have permission to download this document.",
      });
    }

    if (!doc.filePath) {
      return res
        .status(404)
        .json({ message: "No file available for this document." });
    }

    const { data, error } = await supabaseAdmin.storage
      .from(env.SUPABASE_DOCUMENT_BUCKET)
      .createSignedUrl(doc.filePath, 60 * 10);

    if (error || !data?.signedUrl) {
      return res
        .status(500)
        .json({ message: "Unable to generate download URL" });
    }

    await storage.createAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      action: "Download",
      documentId: doc.id,
      documentTitle: doc.title,
    });

    res.status(200).json({
      url: data.signedUrl,
      fileName: doc.fileName || `${doc.title}.${doc.fileType}`,
    });
  });

  app.get(api.documents.viewUrl.path, async (req, res) => {
    const currentUser = await requireAuth(req, res);
    if (!currentUser) return;

    const doc = await storage.getDocument(Number(req.params.id));
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (!canAccessDocument(currentUser, doc)) {
      return res.status(401).json({
        message: "You do not have permission to view this document.",
      });
    }

    if (!doc.filePath) {
      return res
        .status(404)
        .json({ message: "No file available for this document." });
    }

    const { data, error } = await supabaseAdmin.storage
      .from(env.SUPABASE_DOCUMENT_BUCKET)
      .createSignedUrl(doc.filePath, 60 * 10);

    if (error || !data?.signedUrl) {
      return res.status(500).json({ message: "Unable to generate view URL" });
    }

    await storage.createAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      action: "View",
      documentId: doc.id,
      documentTitle: doc.title,
    });

    res.status(200).json({
      url: data.signedUrl,
      fileName: doc.fileName || `${doc.title}.${doc.fileType}`,
    });
  });

  app.put(api.documents.update.path, async (req, res) => {
    try {
      const currentUser = await requireRole(req, res, [
        "Administrator",
        "Lecturer",
      ]);
      if (!currentUser) return;

      const targetDoc = await storage.getDocument(Number(req.params.id));
      if (!targetDoc) {
        return res.status(404).json({ message: "Document not found" });
      }

      if (
        currentUser.role === "Lecturer" &&
        targetDoc.uploadedBy !== currentUser.id
      ) {
        return res.status(401).json({
          message:
            "You can only update visibility for documents uploaded by your account.",
        });
      }

      const input = api.documents.update.input.parse(req.body);
      const doc = await storage.updateDocument(Number(req.params.id), input);
      res.status(200).json(doc);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.documents.delete.path, async (req, res) => {
    const currentUser = await requireRole(req, res, [
      "Administrator",
      "Lecturer",
    ]);
    if (!currentUser) return;

    const doc = await storage.getDocument(Number(req.params.id));
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (currentUser.role === "Lecturer" && doc.uploadedBy !== currentUser.id) {
      return res.status(401).json({
        message: "You can only delete documents uploaded by your account.",
      });
    }

    await storage.deleteDocument(doc.id);
    res.status(204).end();
  });

  app.post(api.documents.approve.path, async (req, res) => {
    try {
      const currentUser = await requireRole(req, res, ["Administrator"]);
      if (!currentUser) return;

      const doc = await storage.updateDocument(Number(req.params.id), {
        status: "Approved",
      });
      res.status(200).json(doc);
    } catch (error) {
      res.status(404).json({ message: "Document not found" });
    }
  });

  // Users
  app.get(api.users.list.path, async (req, res) => {
    const currentUser = await requireRole(req, res, ["Administrator"]);
    if (!currentUser) return;

    const users = await storage.getUsers();
    res.json(users);
  });

  app.post(api.users.create.path, async (req, res) => {
    try {
      const currentUser = await getAuthenticatedUser(req, res);
      if (!currentUser || currentUser.role !== "Administrator") {
        return res
          .status(401)
          .json({ message: "Only administrators can create users." });
      }

      const input = api.users.create.input.parse(req.body);
      const supabaseEmail = uniqueIdToSupabaseEmail(input.uniqueId);
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: supabaseEmail,
          password: input.password,
          email_confirm: true,
          user_metadata: {
            uniqueId: input.uniqueId,
            role: input.role,
          },
        });

      if (authError || !authData.user) {
        const message = authError?.message?.toLowerCase().includes("already")
          ? "This staff ID or matric number already exists on the platform."
          : "Unable to create account at the moment.";
        return res.status(400).json({ message });
      }

      const user = await storage.createUser({
        ...input,
        authUserId: authData.user.id,
        password: "SUPABASE_AUTH",
      });
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.users.idCardUrl.path, async (req, res) => {
    const currentUser = await requireRole(req, res, ["Administrator"]);
    if (!currentUser) return;

    const user = await storage.getUser(Number(req.params.id));
    if (!user?.idCardImage) {
      return res.status(404).json({ message: "ID card image not found" });
    }

    const { data, error } = await supabaseAdmin.storage
      .from(env.SUPABASE_ID_CARD_BUCKET)
      .createSignedUrl(user.idCardImage, 60 * 10);

    if (error || !data?.signedUrl) {
      return res
        .status(500)
        .json({ message: "Unable to generate ID card URL" });
    }

    res.status(200).json({ url: data.signedUrl });
  });

  app.get(api.users.pending.path, async (req, res) => {
    const currentUser = await requireRole(req, res, ["Administrator"]);
    if (!currentUser) return;

    const users = await storage.getUsers();
    const pending = users.filter(
      (u) =>
        u.status === "Pending Approval" &&
        (u.role === "Student" || u.role === "Lecturer"),
    );
    res.status(200).json(pending);
  });

  app.post(api.users.approve.path, async (req, res) => {
    const currentUser = await requireRole(req, res, ["Administrator"]);
    if (!currentUser) return;

    const user = await storage.getUser(Number(req.params.id));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.idCardImage) {
      const { error: removeError } = await supabaseAdmin.storage
        .from(env.SUPABASE_ID_CARD_BUCKET)
        .remove([user.idCardImage]);

      if (
        removeError &&
        !removeError.message.toLowerCase().includes("not found")
      ) {
        return res.status(500).json({
          message: "Unable to remove ID card image during approval.",
        });
      }
    }

    const updated = await storage.updateUser(user.id, {
      status: "Active",
      idCardImage: null,
    });

    await storage.createAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      action: "Approve User",
      documentTitle: updated.name,
    });

    res.status(200).json(updated);
  });

  app.get(api.users.idCardPreview.path, async (req, res) => {
    const currentUser = await requireRole(req, res, ["Administrator"]);
    if (!currentUser) return;

    const user = await storage.getUser(Number(req.params.id));
    if (!user?.idCardImage) {
      return res.status(404).json({ message: "ID card image not found" });
    }

    const { data, error } = await supabaseAdmin.storage
      .from(env.SUPABASE_ID_CARD_BUCKET)
      .download(user.idCardImage);

    if (error || !data) {
      return res.status(404).json({ message: "ID card image not found" });
    }

    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.setHeader("Content-Type", data.type || "application/octet-stream");
    res.setHeader("Cache-Control", "no-store, private");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Disposition", "inline");
    res.status(200).send(buffer);
  });

  app.put(api.users.update.path, async (req, res) => {
    try {
      const currentUser = await requireRole(req, res, ["Administrator"]);
      if (!currentUser) return;

      const input = api.users.update.input.parse(req.body);
      const user = await storage.updateUser(Number(req.params.id), input);
      res.status(200).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.users.delete.path, async (req, res) => {
    const currentUser = await requireRole(req, res, ["Administrator"]);
    if (!currentUser) return;

    const userId = Number(req.params.id);
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.id === currentUser.id) {
      return res
        .status(400)
        .json({ message: "Administrators cannot delete their own account." });
    }

    await storage.deleteUser(user.id);

    if (user.authUserId) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(
        user.authUserId,
      );
      if (error) {
        console.error("Failed to delete auth user:", error.message);
      }
    }

    await storage.createAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      action: "Delete User",
      documentTitle: user.name,
    });

    res.status(204).end();
  });

  // Audit Logs
  app.get(api.auditLogs.list.path, async (req, res) => {
    const currentUser = await requireRole(req, res, ["Administrator"]);
    if (!currentUser) return;

    const logs = await storage.getAuditLogs();
    res.json(logs);
  });

  // Stats endpoints
  app.get(api.stats.admin.path, async (req, res) => {
    const currentUser = await requireRole(req, res, ["Administrator"]);
    if (!currentUser) return;

    const docs = await storage.getDocuments();
    const users = await storage.getUsers();
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const recentUploads = docs.filter((d) => {
      if (!d.date) return false;
      const uploadedAt = new Date(d.date).getTime();
      return now - uploadedAt <= sevenDaysMs;
    }).length;

    res.json({
      totalDocuments: docs.length,
      pendingApprovals: docs.filter((d) => d.status === "Pending Approval")
        .length,
      totalUsers: users.length,
      recentUploads,
    });
  });

  app.get(api.stats.lecturer.path, async (req, res) => {
    const currentUser = await requireRole(req, res, [
      "Lecturer",
      "Administrator",
    ]);
    if (!currentUser) return;

    const userId = currentUser.id;
    const docs = await storage.getDocuments();
    res.json({
      myUploads: docs.filter((d) => d.uploadedBy === userId).length,
      approvedDocuments: docs.filter((d) => d.status === "Approved").length,
      totalDocuments: docs.length,
    });
  });

  app.get(api.stats.student.path, async (req, res) => {
    const currentUser = await requireRole(req, res, [
      "Student",
      "Administrator",
      "Lecturer",
    ]);
    if (!currentUser) return;

    const docs = await storage.getDocuments();
    const approvedDocs = docs.filter((d) => d.status === "Approved");
    res.json({
      availableDocuments: approvedDocs.length,
      recentlyAdded: Math.min(2, approvedDocs.length),
      myDownloads: 0,
    });
  });

  if (process.env.ENABLE_SEED_DATA === "true") {
    seedDatabase().catch(console.error);
  }

  return httpServer;
}

type SeedUserInput = {
  uniqueId: string;
  password: string;
  name: string;
  role: "Administrator" | "Lecturer" | "Student";
  department: string;
  level?: string;
  status?: "Active" | "Inactive";
};

async function findSupabaseUserIdByEmail(
  email: string,
): Promise<string | undefined> {
  let page = 1;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw new Error(
        `Unable to list Supabase users during seed: ${error.message}`,
      );
    }

    const match = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (match) {
      return match.id;
    }

    if (data.users.length < 200) {
      return undefined;
    }

    page += 1;
  }
}

async function ensureSeedUser(input: SeedUserInput) {
  const normalizedUniqueId = input.uniqueId.trim();
  const email = uniqueIdToSupabaseEmail(normalizedUniqueId);
  const existingProfile = await storage.getUserByUniqueId(normalizedUniqueId);

  let authUserId = existingProfile?.authUserId ?? undefined;

  if (!authUserId) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        uniqueId: normalizedUniqueId,
        seeded: true,
      },
    });

    if (error) {
      if (!error.message.toLowerCase().includes("already")) {
        throw new Error(
          `Unable to create auth user for ${normalizedUniqueId}: ${error.message}`,
        );
      }

      authUserId = await findSupabaseUserIdByEmail(email);
      if (!authUserId) {
        throw new Error(
          `Auth user exists but could not be resolved for ${normalizedUniqueId}.`,
        );
      }
    } else {
      authUserId = data.user?.id;
    }
  }

  if (!authUserId) {
    throw new Error(`Missing Supabase auth user id for ${normalizedUniqueId}.`);
  }

  if (existingProfile) {
    return storage.updateUser(existingProfile.id, {
      authUserId,
      password: "SUPABASE_AUTH",
      role: input.role,
      department: input.department,
      level: input.level ?? null,
      status: input.status ?? "Active",
    });
  }

  return storage.createUser({
    authUserId,
    uniqueId: normalizedUniqueId,
    password: "SUPABASE_AUTH",
    name: input.name,
    role: input.role,
    department: input.department,
    level: input.level ?? null,
    idCardImage: null,
    status: input.status ?? "Active",
  });
}

async function seedDatabase() {
  const existingUsers = await storage.getUsers();
  if (existingUsers.length > 0) {
    return;
  }

  const admin = await ensureSeedUser({
    uniqueId: "ADMIN-001",
    password: "Admin@2024",
    name: "Wg Cdr. Abubakar Yusuf",
    role: "Administrator",
    department: "ICT Engineering",
  });

  const fatima = await ensureSeedUser({
    uniqueId: "SS/CE/0042",
    password: "Staff@2024",
    name: "Dr. Fatima Aliyu",
    role: "Lecturer",
    department: "ICT Engineering",
  });

  await ensureSeedUser({
    uniqueId: "SS/CE/0031",
    password: "Staff@2024",
    name: "Engr. Musa Danladi",
    role: "Lecturer",
    department: "ICT Engineering",
  });

  await ensureSeedUser({
    uniqueId: "SS/CE/0055",
    password: "Staff@2024",
    name: "Dr. Ngozi Eze",
    role: "Lecturer",
    department: "ICT Engineering",
  });

  const yahaya = await ensureSeedUser({
    uniqueId: "U21ICT1014",
    password: "Student@2026",
    name: "Yahaya Abubakar Adebayo",
    role: "Student",
    department: "ICT Engineering",
    level: "500 Level",
  });

  await ensureSeedUser({
    uniqueId: "U21CE1102",
    password: "Student@2024",
    name: "Aisha Mohammed",
    role: "Student",
    department: "ICT Engineering",
    level: "400 Level",
  });

  const docProjectGuide = await storage.createDocument({
    title: "Final Year Project Format Guide 2024",
    category: "Project Resources",
    uploadedBy: fatima.id,
    uploadedByName: fatima.name,
    fileType: "PDF",
    size: "1.2 MB",
    status: "Approved",
    description: "Standard formatting guidelines for all 500L projects.",
  });

  await storage.createDocument({
    title: "Department Examination Timetable — Semester 1, 2024/2025",
    category: "Examination Records",
    uploadedBy: admin.id,
    uploadedByName: admin.name,
    fileType: "PDF",
    size: "340 KB",
    status: "Approved",
    description: "Official timetable for the upcoming semester exams.",
  });

  await storage.createDocument({
    title: "Staff Meeting Minutes — October 2024",
    category: "Administrative",
    uploadedBy: admin.id,
    uploadedByName: admin.name,
    fileType: "DOCX",
    size: "218 KB",
    status: "Approved",
    description: "Minutes from the department staff meeting.",
  });

  await storage.createDocument({
    title: "ICT Engineering Curriculum Review 2023",
    category: "Academic Policy",
    uploadedBy: fatima.id,
    uploadedByName: fatima.name,
    fileType: "PDF",
    size: "2.8 MB",
    status: "Approved",
    description: "NUC updated curriculum document.",
  });

  const docLabSafety = await storage.createDocument({
    title: "Laboratory Safety Guidelines",
    category: "Administrative",
    uploadedBy: fatima.id,
    uploadedByName: fatima.name,
    fileType: "PDF",
    size: "890 KB",
    status: "Approved",
    description: "Mandatory safety protocols for all hardware labs.",
  });

  await storage.createDocument({
    title: "HOD Circular — Student Industrial Training Placement 2025",
    category: "Administrative",
    uploadedBy: admin.id,
    uploadedByName: admin.name,
    fileType: "PDF",
    size: "156 KB",
    status: "Pending Approval",
    description: "Notice regarding IT placements for 400L students.",
  });

  const docResearch = await storage.createDocument({
    title: "Research Output: Embedded Systems Applications in UAV Control",
    category: "Research Output",
    uploadedBy: fatima.id,
    uploadedByName: fatima.name,
    fileType: "PDF",
    size: "4.1 MB",
    status: "Approved",
    description: "Recent publication on UAV flight controllers.",
  });

  await storage.createDocument({
    title: "Department Budget Proposal 2025",
    category: "Administrative",
    uploadedBy: admin.id,
    uploadedByName: admin.name,
    fileType: "XLSX",
    size: "512 KB",
    status: "Pending Approval",
    description: "Draft budget for the upcoming academic year.",
  });

  await storage.createAuditLog({
    userId: admin.id,
    userName: admin.name,
    action: "Login",
    ipAddress: "192.168.1.104",
  });

  await storage.createAuditLog({
    userId: fatima.id,
    userName: fatima.name,
    action: "Upload",
    documentId: docResearch.id,
    documentTitle: "Research Output: Embedded Systems...",
    ipAddress: "192.168.1.112",
  });

  await storage.createAuditLog({
    userId: yahaya.id,
    userName: "Yahaya Abubakar",
    action: "Download",
    documentId: docProjectGuide.id,
    documentTitle: "Final Year Project Format Guide",
    ipAddress: "10.0.0.45",
  });

  await storage.createAuditLog({
    userId: admin.id,
    userName: admin.name,
    action: "Approve",
    documentId: docLabSafety.id,
    documentTitle: "Laboratory Safety Guidelines",
    ipAddress: "192.168.1.104",
  });

  console.log("Database seeded successfully with Supabase-auth-linked users.");
}
