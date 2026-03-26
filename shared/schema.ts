import { z } from "zod";

export const userSchema = z.object({
  id: z.number(),
  authUserId: z.string().nullable(),
  uniqueId: z.string(),
  password: z.string(),
  name: z.string(),
  role: z.string(),
  department: z.string(),
  level: z.string().nullable(),
  idCardImage: z.string().nullable(),
  status: z.string(),
  createdAt: z.date().nullable(),
});

export const documentSchema = z.object({
  id: z.number(),
  title: z.string(),
  category: z.string(),
  uploadedBy: z.number(),
  uploadedByName: z.string(),
  date: z.date().nullable(),
  fileType: z.string(),
  fileName: z.string().nullable(),
  filePath: z.string().nullable(),
  allowStaffAccess: z.boolean(),
  allowStudentAccess: z.boolean(),
  size: z.string(),
  status: z.string(),
  description: z.string().nullable(),
});

export const auditLogSchema = z.object({
  id: z.number(),
  userId: z.number(),
  userName: z.string(),
  action: z.string(),
  documentId: z.number().nullable(),
  documentTitle: z.string().nullable(),
  ipAddress: z.string().nullable(),
  date: z.date().nullable(),
});

export const insertUserSchema = z.object({
  authUserId: z.string().nullable().optional(),
  uniqueId: z.string(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  name: z.string(),
  role: z.string(),
  department: z.string(),
  level: z.string().nullable().optional(),
  idCardImage: z.string().nullable().optional(),
  status: z.string().optional(),
});

export const insertDocumentSchema = z.object({
  title: z.string(),
  category: z.string(),
  uploadedBy: z.number(),
  uploadedByName: z.string(),
  fileType: z.string(),
  fileName: z.string().optional(),
  filePath: z.string().nullable().optional(),
  allowStaffAccess: z.boolean().optional(),
  allowStudentAccess: z.boolean().optional(),
  fileData: z.string().optional(),
  size: z.string(),
  status: z.string(),
  description: z.string().nullable().optional(),
});

export const insertAuditLogSchema = z.object({
  userId: z.number(),
  userName: z.string(),
  action: z.string(),
  documentId: z.number().nullable().optional(),
  documentTitle: z.string().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
});

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Document = z.infer<typeof documentSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type AuditLog = z.infer<typeof auditLogSchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
