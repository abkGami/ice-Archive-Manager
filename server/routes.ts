import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Basic session setup for mock auth
  app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // False for dev
  }));

  // Auth routes
  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      const user = await storage.getUserByUniqueId(input.uniqueId);
      
      if (!user || user.password !== input.password) {
        return res.status(401).json({ message: "Invalid identifier or password." });
      }
      
      // Store in session
      (req.session as any).userId = user.id;
      
      // Log login
      await storage.createAuditLog({
        userId: user.id,
        userName: user.name,
        action: "Login",
      });

      res.status(200).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy(() => {
      res.status(200).json({ success: true });
    });
  });

  app.get(api.auth.me.path, async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.status(200).json(user);
  });

  // Documents
  app.get(api.documents.list.path, async (req, res) => {
    try {
      // Validate query params if needed, but keeping it loose for now
      const docs = await storage.getDocuments({
        category: req.query.category as string,
        status: req.query.status as string,
      });
      res.json(docs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get(api.documents.get.path, async (req, res) => {
    const doc = await storage.getDocument(Number(req.params.id));
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }
    res.json(doc);
  });

  app.post(api.documents.create.path, async (req, res) => {
    try {
      const input = api.documents.create.input.parse(req.body);
      const doc = await storage.createDocument(input);
      res.status(201).json(doc);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.documents.update.path, async (req, res) => {
    try {
      const input = api.documents.update.input.parse(req.body);
      const doc = await storage.updateDocument(Number(req.params.id), input);
      res.status(200).json(doc);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.documents.delete.path, async (req, res) => {
    await storage.deleteDocument(Number(req.params.id));
    res.status(204).end();
  });

  app.post(api.documents.approve.path, async (req, res) => {
    try {
      const doc = await storage.updateDocument(Number(req.params.id), { status: 'Approved' });
      res.status(200).json(doc);
    } catch (error) {
      res.status(404).json({ message: "Document not found" });
    }
  });

  // Users
  app.get(api.users.list.path, async (req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });

  app.post(api.users.create.path, async (req, res) => {
    try {
      const input = api.users.create.input.parse(req.body);
      const user = await storage.createUser(input);
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.users.update.path, async (req, res) => {
    try {
      const input = api.users.update.input.parse(req.body);
      const user = await storage.updateUser(Number(req.params.id), input);
      res.status(200).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Audit Logs
  app.get(api.auditLogs.list.path, async (req, res) => {
    const logs = await storage.getAuditLogs();
    res.json(logs);
  });

  // Stats endpoints
  app.get(api.stats.admin.path, async (req, res) => {
    const docs = await storage.getDocuments();
    const users = await storage.getUsers();
    res.json({
      totalDocuments: docs.length,
      pendingApprovals: docs.filter(d => d.status === 'Pending Approval').length,
      totalUsers: users.length,
      recentUploads: docs.length > 0 ? 3 : 0, // Mock
    });
  });

  app.get(api.stats.lecturer.path, async (req, res) => {
    const userId = (req.session as any)?.userId || 2; // Default to Dr. Fatima
    const docs = await storage.getDocuments();
    res.json({
      myUploads: docs.filter(d => d.uploadedBy === userId).length,
      approvedDocuments: docs.filter(d => d.status === 'Approved').length,
      totalDocuments: docs.length,
    });
  });

  app.get(api.stats.student.path, async (req, res) => {
    const docs = await storage.getDocuments();
    const approvedDocs = docs.filter(d => d.status === 'Approved');
    res.json({
      availableDocuments: approvedDocs.length,
      recentlyAdded: Math.min(2, approvedDocs.length),
      myDownloads: 0,
    });
  });

  // Call seed database
  seedDatabase().catch(console.error);

  return httpServer;
}

async function seedDatabase() {
  const users = await storage.getUsers();
  if (users.length === 0) {
    // 1. Create Users
    await storage.createUser({
      uniqueId: "ADMIN-001",
      password: "Admin@2024",
      name: "Wg Cdr. Abubakar Yusuf",
      role: "Administrator",
      department: "Computer Engineering",
      status: "Active"
    });

    await storage.createUser({
      uniqueId: "SS/CE/0042",
      password: "Staff@2024",
      name: "Dr. Fatima Aliyu",
      role: "Lecturer",
      department: "Computer Engineering",
      status: "Active"
    });

    await storage.createUser({
      uniqueId: "SS/CE/0031",
      password: "Staff@2024",
      name: "Engr. Musa Danladi",
      role: "Lecturer",
      department: "Computer Engineering",
      status: "Active"
    });

    await storage.createUser({
      uniqueId: "SS/CE/0055",
      password: "Staff@2024",
      name: "Dr. Ngozi Eze",
      role: "Lecturer",
      department: "Computer Engineering",
      status: "Active"
    });

    await storage.createUser({
      uniqueId: "U21CE1089",
      password: "Student@2024",
      name: "Chukwuemeka Obi",
      role: "Student",
      department: "Computer Engineering",
      level: "400 Level",
      status: "Active"
    });

    await storage.createUser({
      uniqueId: "U21CE1102",
      password: "Student@2024",
      name: "Aisha Mohammed",
      role: "Student",
      department: "Computer Engineering",
      level: "400 Level",
      status: "Active"
    });

    // 2. Create Documents
    await storage.createDocument({
      title: "Final Year Project Format Guide 2024",
      category: "Project Resources",
      uploadedBy: 2,
      uploadedByName: "Dr. Fatima Aliyu",
      fileType: "PDF",
      size: "1.2 MB",
      status: "Approved",
      description: "Standard formatting guidelines for all 500L projects."
    });

    await storage.createDocument({
      title: "Department Examination Timetable — Semester 1, 2024/2025",
      category: "Examination Records",
      uploadedBy: 1,
      uploadedByName: "Wg Cdr. Abubakar Yusuf",
      fileType: "PDF",
      size: "340 KB",
      status: "Approved",
      description: "Official timetable for the upcoming semester exams."
    });

    await storage.createDocument({
      title: "Staff Meeting Minutes — October 2024",
      category: "Administrative",
      uploadedBy: 1,
      uploadedByName: "Wg Cdr. Abubakar Yusuf",
      fileType: "DOCX",
      size: "218 KB",
      status: "Approved",
      description: "Minutes from the department staff meeting."
    });

    await storage.createDocument({
      title: "Computer Engineering Curriculum Review 2023",
      category: "Academic Policy",
      uploadedBy: 2,
      uploadedByName: "Dr. Fatima Aliyu",
      fileType: "PDF",
      size: "2.8 MB",
      status: "Approved",
      description: "NUC updated curriculum document."
    });

    await storage.createDocument({
      title: "Laboratory Safety Guidelines",
      category: "Administrative",
      uploadedBy: 2,
      uploadedByName: "Dr. Fatima Aliyu",
      fileType: "PDF",
      size: "890 KB",
      status: "Approved",
      description: "Mandatory safety protocols for all hardware labs."
    });

    await storage.createDocument({
      title: "HOD Circular — Student Industrial Training Placement 2025",
      category: "Administrative",
      uploadedBy: 1,
      uploadedByName: "Wg Cdr. Abubakar Yusuf",
      fileType: "PDF",
      size: "156 KB",
      status: "Pending Approval",
      description: "Notice regarding IT placements for 400L students."
    });

    await storage.createDocument({
      title: "Research Output: Embedded Systems Applications in UAV Control",
      category: "Research Output",
      uploadedBy: 2,
      uploadedByName: "Dr. Fatima Aliyu",
      fileType: "PDF",
      size: "4.1 MB",
      status: "Approved",
      description: "Recent publication on UAV flight controllers."
    });

    await storage.createDocument({
      title: "Department Budget Proposal 2025",
      category: "Administrative",
      uploadedBy: 1,
      uploadedByName: "Wg Cdr. Abubakar Yusuf",
      fileType: "XLSX",
      size: "512 KB",
      status: "Pending Approval",
      description: "Draft budget for the upcoming academic year."
    });

    // 3. Create Audit Logs
    await storage.createAuditLog({
      userId: 1,
      userName: "Wg Cdr. Abubakar Yusuf",
      action: "Login",
      ipAddress: "192.168.1.104"
    });

    await storage.createAuditLog({
      userId: 2,
      userName: "Dr. Fatima Aliyu",
      action: "Upload",
      documentId: 7,
      documentTitle: "Research Output: Embedded Systems...",
      ipAddress: "192.168.1.112"
    });

    await storage.createAuditLog({
      userId: 5,
      userName: "Chukwuemeka Obi",
      action: "Download",
      documentId: 1,
      documentTitle: "Final Year Project Format Guide",
      ipAddress: "10.0.0.45"
    });

    await storage.createAuditLog({
      userId: 1,
      userName: "Wg Cdr. Abubakar Yusuf",
      action: "Approve",
      documentId: 5,
      documentTitle: "Laboratory Safety Guidelines",
      ipAddress: "192.168.1.104"
    });
    
    console.log("Database seeded successfully with dummy data.");
  }
}
