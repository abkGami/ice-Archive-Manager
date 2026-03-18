import {
  type User,
  type InsertUser,
  type Document,
  type InsertDocument,
  type AuditLog,
  type InsertAuditLog,
} from "@shared/schema";
import { supabaseAdmin } from "./supabase-client";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByAuthUserId(authUserId: string): Promise<User | undefined>;
  getUserByUniqueId(uniqueId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  getUsers(): Promise<User[]>;

  // Documents
  getDocuments(filters?: {
    category?: string;
    status?: string;
  }): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(doc: InsertDocument): Promise<Document>;
  updateDocument(id: number, doc: Partial<InsertDocument>): Promise<Document>;
  deleteDocument(id: number): Promise<void>;

  // Audit Logs
  getAuditLogs(): Promise<AuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
}

type DbUserRow = {
  id: number;
  auth_user_id: string | null;
  unique_id: string;
  password: string;
  name: string;
  role: string;
  department: string;
  level: string | null;
  id_card_image: string | null;
  status: string;
  created_at: string | null;
};

type DbDocumentRow = {
  id: number;
  title: string;
  category: string;
  uploaded_by: number;
  uploaded_by_name: string;
  date: string | null;
  file_type: string;
  file_name?: string | null;
  file_path?: string | null;
  size: string;
  status: string;
  description: string | null;
};

type DbAuditLogRow = {
  id: number;
  user_id: number;
  user_name: string;
  action: string;
  document_id: number | null;
  document_title: string | null;
  ip_address: string | null;
  date: string | null;
};

function toUser(row: DbUserRow): User {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    uniqueId: row.unique_id,
    password: row.password,
    name: row.name,
    role: row.role,
    department: row.department,
    level: row.level,
    idCardImage: row.id_card_image,
    status: row.status,
    createdAt: row.created_at ? new Date(row.created_at) : null,
  };
}

function toDocument(row: DbDocumentRow): Document {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    uploadedBy: row.uploaded_by,
    uploadedByName: row.uploaded_by_name,
    date: row.date ? new Date(row.date) : null,
    fileType: row.file_type,
    fileName: row.file_name ?? null,
    filePath: row.file_path ?? null,
    size: row.size,
    status: row.status,
    description: row.description,
  };
}

function toAuditLog(row: DbAuditLogRow): AuditLog {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    action: row.action,
    documentId: row.document_id,
    documentTitle: row.document_title,
    ipAddress: row.ip_address,
    date: row.date ? new Date(row.date) : null,
  };
}

export class SupabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle<DbUserRow>();

    if (error) throw new Error(`Failed to fetch user: ${error.message}`);
    return data ? toUser(data) : undefined;
  }

  async getUserByAuthUserId(authUserId: string): Promise<User | undefined> {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("auth_user_id", authUserId)
      .maybeSingle<DbUserRow>();

    if (error) {
      if (
        error.message.toLowerCase().includes("auth_user_id") &&
        error.message.toLowerCase().includes("column")
      ) {
        return undefined;
      }
      throw new Error(`Failed to fetch user by auth id: ${error.message}`);
    }
    return data ? toUser(data) : undefined;
  }

  async getUserByUniqueId(uniqueId: string): Promise<User | undefined> {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("unique_id", uniqueId)
      .maybeSingle<DbUserRow>();

    if (error) {
      if (error.message.toLowerCase().includes("could not find the table")) {
        throw new Error(
          "SUPABASE_SCHEMA_NOT_READY: users table is missing in project database",
        );
      }
      throw new Error(`Failed to fetch user by unique id: ${error.message}`);
    }
    return data ? toUser(data) : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const payload: Record<string, unknown> = {
      unique_id: user.uniqueId,
      password: user.password,
      name: user.name,
      role: user.role,
      department: user.department,
      level: user.level ?? null,
      id_card_image: user.idCardImage ?? null,
      status: user.status ?? "Active",
    };

    if (typeof user.authUserId !== "undefined") {
      payload.auth_user_id = user.authUserId;
    }

    let { data, error } = await supabaseAdmin
      .from("users")
      .insert(payload)
      .select("*")
      .single<DbUserRow>();

    if (
      error &&
      error.message.toLowerCase().includes("auth_user_id") &&
      error.message.toLowerCase().includes("column")
    ) {
      delete payload.auth_user_id;
      const retry = await supabaseAdmin
        .from("users")
        .insert(payload)
        .select("*")
        .single<DbUserRow>();
      data = retry.data;
      error = retry.error;
    }

    if (error) throw new Error(`Failed to create user: ${error.message}`);
    if (!data)
      throw new Error("Failed to create user: empty response from Supabase");
    return toUser(data);
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const payload: Record<string, unknown> = {};
    if (typeof updates.authUserId !== "undefined")
      payload.auth_user_id = updates.authUserId;
    if (typeof updates.uniqueId !== "undefined")
      payload.unique_id = updates.uniqueId;
    if (typeof updates.password !== "undefined")
      payload.password = updates.password;
    if (typeof updates.name !== "undefined") payload.name = updates.name;
    if (typeof updates.role !== "undefined") payload.role = updates.role;
    if (typeof updates.department !== "undefined")
      payload.department = updates.department;
    if (typeof updates.level !== "undefined") payload.level = updates.level;
    if (typeof updates.idCardImage !== "undefined")
      payload.id_card_image = updates.idCardImage;
    if (typeof updates.status !== "undefined") payload.status = updates.status;

    let { data, error } = await supabaseAdmin
      .from("users")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single<DbUserRow>();

    if (
      error &&
      error.message.toLowerCase().includes("auth_user_id") &&
      error.message.toLowerCase().includes("column")
    ) {
      delete payload.auth_user_id;
      const retry = await supabaseAdmin
        .from("users")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single<DbUserRow>();
      data = retry.data;
      error = retry.error;
    }

    if (error) throw new Error(`Failed to update user: ${error.message}`);
    if (!data)
      throw new Error("Failed to update user: empty response from Supabase");
    return toUser(data);
  }

  async getUsers(): Promise<User[]> {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .order("id", { ascending: true })
      .returns<DbUserRow[]>();

    if (error) throw new Error(`Failed to fetch users: ${error.message}`);
    return (data ?? []).map(toUser);
  }

  async deleteUser(id: number): Promise<void> {
    const { error: auditError } = await supabaseAdmin
      .from("audit_logs")
      .delete()
      .eq("user_id", id);
    if (auditError) {
      throw new Error(
        `Failed to delete user audit logs: ${auditError.message}`,
      );
    }

    const { error } = await supabaseAdmin.from("users").delete().eq("id", id);
    if (error) throw new Error(`Failed to delete user: ${error.message}`);
  }

  async getDocuments(filters?: {
    category?: string;
    status?: string;
  }): Promise<Document[]> {
    let query = supabaseAdmin
      .from("documents")
      .select("*")
      .order("id", { ascending: false });

    if (filters?.category && filters.category !== "All Categories") {
      query = query.eq("category", filters.category);
    }
    if (filters?.status && filters.status !== "All Status") {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query.returns<DbDocumentRow[]>();
    if (error) throw new Error(`Failed to fetch documents: ${error.message}`);
    return (data ?? []).map(toDocument);
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const { data, error } = await supabaseAdmin
      .from("documents")
      .select("*")
      .eq("id", id)
      .maybeSingle<DbDocumentRow>();

    if (error) throw new Error(`Failed to fetch document: ${error.message}`);
    return data ? toDocument(data) : undefined;
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    const payload = {
      title: doc.title,
      category: doc.category,
      uploaded_by: doc.uploadedBy,
      uploaded_by_name: doc.uploadedByName,
      file_type: doc.fileType,
      file_name: doc.fileName ?? null,
      file_path: doc.filePath ?? null,
      size: doc.size,
      status: doc.status,
      description: doc.description ?? null,
    };

    const { data, error } = await supabaseAdmin
      .from("documents")
      .insert(payload)
      .select("*")
      .single<DbDocumentRow>();

    if (error) throw new Error(`Failed to create document: ${error.message}`);
    return toDocument(data);
  }

  async updateDocument(
    id: number,
    updates: Partial<InsertDocument>,
  ): Promise<Document> {
    const payload: Record<string, unknown> = {};
    if (typeof updates.title !== "undefined") payload.title = updates.title;
    if (typeof updates.category !== "undefined")
      payload.category = updates.category;
    if (typeof updates.uploadedBy !== "undefined")
      payload.uploaded_by = updates.uploadedBy;
    if (typeof updates.uploadedByName !== "undefined")
      payload.uploaded_by_name = updates.uploadedByName;
    if (typeof updates.fileType !== "undefined")
      payload.file_type = updates.fileType;
    if (typeof updates.fileName !== "undefined")
      payload.file_name = updates.fileName;
    if (typeof updates.filePath !== "undefined")
      payload.file_path = updates.filePath;
    if (typeof updates.size !== "undefined") payload.size = updates.size;
    if (typeof updates.status !== "undefined") payload.status = updates.status;
    if (typeof updates.description !== "undefined")
      payload.description = updates.description;

    const { data, error } = await supabaseAdmin
      .from("documents")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single<DbDocumentRow>();

    if (error) throw new Error(`Failed to update document: ${error.message}`);
    return toDocument(data);
  }

  async deleteDocument(id: number): Promise<void> {
    const { error } = await supabaseAdmin
      .from("documents")
      .delete()
      .eq("id", id);

    if (error) throw new Error(`Failed to delete document: ${error.message}`);
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    const { data, error } = await supabaseAdmin
      .from("audit_logs")
      .select("*")
      .order("id", { ascending: false })
      .returns<DbAuditLogRow[]>();

    if (error) throw new Error(`Failed to fetch audit logs: ${error.message}`);
    return (data ?? []).map(toAuditLog);
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const payload = {
      user_id: log.userId,
      user_name: log.userName,
      action: log.action,
      document_id: log.documentId ?? null,
      document_title: log.documentTitle ?? null,
      ip_address: log.ipAddress ?? null,
    };

    const { data, error } = await supabaseAdmin
      .from("audit_logs")
      .insert(payload)
      .select("*")
      .single<DbAuditLogRow>();

    if (error) throw new Error(`Failed to create audit log: ${error.message}`);
    return toAuditLog(data);
  }
}

export const storage: IStorage = new SupabaseStorage();
