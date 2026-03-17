import type {
  User,
  Document,
  AuditLog,
  InsertUser,
  InsertDocument,
  InsertAuditLog,
} from "@shared/schema";
import type { IStorage } from "./storage";

// In-memory data
let users: User[] = [];
let documents: Document[] = [];
let auditLogs: AuditLog[] = [];

let nextUserId = 1;
let nextDocumentId = 1;
let nextAuditLogId = 1;

export class MockStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    return users.find((u) => u.id === id);
  }

  async getUserByAuthUserId(authUserId: string): Promise<User | undefined> {
    return users.find((u) => u.authUserId === authUserId);
  }

  async getUserByUniqueId(uniqueId: string): Promise<User | undefined> {
    return users.find((u) => u.uniqueId === uniqueId);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: nextUserId++,
      ...user,
      authUserId: user.authUserId ?? null,
      status: user.status ?? "Active",
      level: user.level ?? null,
      idCardImage: user.idCardImage ?? null,
      createdAt: new Date(),
    };
    users.push(newUser);
    return newUser;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error("User not found");
    users[index] = { ...users[index], ...updates };
    return users[index];
  }

  async getUsers(): Promise<User[]> {
    return [...users];
  }

  async getDocuments(filters?: {
    category?: string;
    status?: string;
  }): Promise<Document[]> {
    let result = [...documents];

    if (filters?.category && filters.category !== "All Categories") {
      result = result.filter((d) => d.category === filters.category);
    }
    if (filters?.status && filters.status !== "All Status") {
      result = result.filter((d) => d.status === filters.status);
    }

    return result.sort((a, b) => b.id - a.id);
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return documents.find((d) => d.id === id);
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    const newDoc: Document = {
      id: nextDocumentId++,
      ...doc,
      fileName: doc.fileName ?? null,
      filePath: doc.filePath ?? null,
      description: doc.description ?? null,
      date: new Date(),
    };
    documents.push(newDoc);
    return newDoc;
  }

  async updateDocument(
    id: number,
    updates: Partial<InsertDocument>,
  ): Promise<Document> {
    const index = documents.findIndex((d) => d.id === id);
    if (index === -1) throw new Error("Document not found");
    documents[index] = { ...documents[index], ...updates };
    return documents[index];
  }

  async deleteDocument(id: number): Promise<void> {
    documents = documents.filter((d) => d.id !== id);
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return [...auditLogs].sort((a, b) => b.id - a.id);
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const newLog: AuditLog = {
      id: nextAuditLogId++,
      ...log,
      documentId: log.documentId ?? null,
      documentTitle: log.documentTitle ?? null,
      ipAddress: log.ipAddress ?? null,
      date: new Date(),
    };
    auditLogs.push(newLog);
    return newLog;
  }
}
