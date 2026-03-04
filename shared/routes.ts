import { z } from "zod";
import {
  insertUserSchema,
  insertDocumentSchema,
  insertAuditLogSchema,
  users,
  documents,
  auditLogs,
} from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: "POST" as const,
      path: "/api/auth/login" as const,
      input: z.object({
        uniqueId: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: "POST" as const,
      path: "/api/auth/logout" as const,
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
    me: {
      method: "GET" as const,
      path: "/api/auth/me" as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  documents: {
    list: {
      method: "GET" as const,
      path: "/api/documents" as const,
      input: z
        .object({
          category: z.string().optional(),
          status: z.string().optional(),
          search: z.string().optional(),
        })
        .optional(),
      responses: {
        200: z.array(z.custom<typeof documents.$inferSelect>()),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/documents/:id" as const,
      responses: {
        200: z.custom<typeof documents.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/documents" as const,
      input: insertDocumentSchema,
      responses: {
        201: z.custom<typeof documents.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: "PUT" as const,
      path: "/api/documents/:id" as const,
      input: insertDocumentSchema.partial(),
      responses: {
        200: z.custom<typeof documents.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/documents/:id" as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    approve: {
      method: "POST" as const,
      path: "/api/documents/:id/approve" as const,
      responses: {
        200: z.custom<typeof documents.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  users: {
    list: {
      method: "GET" as const,
      path: "/api/users" as const,
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/users" as const,
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: "PUT" as const,
      path: "/api/users/:id" as const,
      input: insertUserSchema.partial(),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
  },
  auditLogs: {
    list: {
      method: "GET" as const,
      path: "/api/audit-logs" as const,
      responses: {
        200: z.array(z.custom<typeof auditLogs.$inferSelect>()),
      },
    },
  },
  stats: {
    admin: {
      method: "GET" as const,
      path: "/api/stats/admin" as const,
      responses: {
        200: z.object({
          totalDocuments: z.number(),
          pendingApprovals: z.number(),
          totalUsers: z.number(),
          recentUploads: z.number(),
        }),
      },
    },
    lecturer: {
      method: "GET" as const,
      path: "/api/stats/lecturer" as const,
      responses: {
        200: z.object({
          myUploads: z.number(),
          approvedDocuments: z.number(),
          totalDocuments: z.number(),
        }),
      },
    },
    student: {
      method: "GET" as const,
      path: "/api/stats/student" as const,
      responses: {
        200: z.object({
          availableDocuments: z.number(),
          recentlyAdded: z.number(),
          myDownloads: z.number(), // Always 0/dummy
        }),
      },
    },
  },
};

export function buildUrl(
  path: string,
  params?: Record<string, string | number>
): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type LoginInput = z.infer<typeof api.auth.login.input>;
export type DocumentInput = z.infer<typeof api.documents.create.input>;
export type UserInput = z.infer<typeof api.users.create.input>;
