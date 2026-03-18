import type { User, Document, AuditLog } from "@shared/schema";

// Mock data storage
let mockUsers: User[] = [
  {
    id: 1,
    authUserId: null,
    uniqueId: "admin001",
    password: "admin123",
    name: "Admin User",
    role: "Administrator",
    department: "IT",
    level: null,
    idCardImage: null,
    status: "Active",
    createdAt: new Date(),
  },
  {
    id: 2,
    authUserId: null,
    uniqueId: "LEC001",
    password: "lecturer123",
    name: "Dr. John Smith",
    role: "Lecturer",
    department: "Computer Science",
    level: null,
    idCardImage: null,
    status: "Active",
    createdAt: new Date(),
  },
  {
    id: 3,
    authUserId: null,
    uniqueId: "STU001",
    password: "student123",
    name: "Jane Doe",
    role: "Student",
    department: "Computer Science",
    level: "400",
    idCardImage: null,
    status: "Active",
    createdAt: new Date(),
  },
];

let mockDocuments: Document[] = [
  {
    id: 1,
    title: "Introduction to Computer Science",
    category: "Lecture Notes",
    uploadedBy: 2,
    uploadedByName: "Dr. John Smith",
    date: new Date("2024-01-15"),
    fileType: "PDF",
    fileName: null,
    filePath: null,
    allowStaffAccess: true,
    allowStudentAccess: true,
    size: "2.5 MB",
    status: "Approved",
    description: "First semester lecture notes for CS101",
  },
  {
    id: 2,
    title: "Data Structures Assignment",
    category: "Assignments",
    uploadedBy: 2,
    uploadedByName: "Dr. John Smith",
    date: new Date("2024-02-01"),
    fileType: "PDF",
    fileName: null,
    filePath: null,
    allowStaffAccess: true,
    allowStudentAccess: true,
    size: "1.2 MB",
    status: "Approved",
    description: "Assignment on linked lists and trees",
  },
];

let mockAuditLogs: AuditLog[] = [
  {
    id: 1,
    userId: 1,
    userName: "Admin User",
    action: "Login",
    documentId: null,
    documentTitle: null,
    ipAddress: "127.0.0.1",
    date: new Date(),
  },
];

let nextUserId = 4;
let nextDocumentId = 3;
let nextAuditLogId = 2;

// Helper to match where conditions
function matchesWhere(item: any, where: any): boolean {
  if (!where) return true;

  // Handle condition objects
  if (where.sql) {
    // This is a generated condition object
    return true; // We'll handle this differently
  }

  for (const key in where) {
    if (item[key] !== where[key]) return false;
  }
  return true;
}

// Mock query builder
class MockQueryBuilder {
  private data: any[];
  private whereConditions: any[] = [];
  private orderByField: string | null = null;
  private orderByDirection: "asc" | "desc" = "asc";

  constructor(data: any[]) {
    this.data = data;
  }

  where(condition: any) {
    this.whereConditions.push(condition);
    return this;
  }

  orderBy(field: any) {
    // Simple mock - just store for later
    this.orderByField = field;
    this.orderByDirection = "desc";
    return this;
  }

  $dynamic() {
    return this;
  }

  async execute() {
    let result = [...this.data];

    // Apply where conditions (simplified)
    if (this.whereConditions.length > 0) {
      // For now, just return all data
      // In a real implementation, we'd parse the condition objects
    }

    // Apply ordering
    if (this.orderByField) {
      result.sort((a, b) => {
        if (this.orderByDirection === "desc") {
          return b.id - a.id;
        }
        return a.id - b.id;
      });
    }

    return result;
  }

  then(resolve: any, reject: any) {
    return this.execute().then(resolve, reject);
  }
}

// Mock database interface
export const mockDb = {
  select() {
    return {
      from(table: any) {
        let data: any[] = [];
        if (table === mockDb._tables.users) {
          data = mockUsers;
        } else if (table === mockDb._tables.documents) {
          data = mockDocuments;
        } else if (table === mockDb._tables.auditLogs) {
          data = mockAuditLogs;
        }

        return {
          where(condition: any) {
            // Extract the field and value from the condition
            const filtered = data.filter((item) => {
              // Simple eq() condition handling
              if (condition && typeof condition === "object") {
                // Try to extract field name and value
                const condStr = condition.toString();
                // This is a simplified approach
                return true; // For now, return first match
              }
              return true;
            });

            return Promise.resolve(filtered.length > 0 ? filtered : []);
          },
          orderBy(field: any) {
            const sorted = [...data].sort((a, b) => b.id - a.id);
            return Promise.resolve(sorted);
          },
          $dynamic() {
            return new MockQueryBuilder(data);
          },
          then(resolve: any) {
            return Promise.resolve(data).then(resolve);
          },
        };
      },
    };
  },

  insert(table: any) {
    return {
      values(data: any) {
        return {
          async returning() {
            let newItem: any;

            if (table === mockDb._tables.users) {
              newItem = {
                id: nextUserId++,
                authUserId: null,
                status: "Active",
                level: null,
                idCardImage: null,
                ...data,
                createdAt: new Date(),
              };
              mockUsers.push(newItem);
            } else if (table === mockDb._tables.documents) {
              newItem = {
                id: nextDocumentId++,
                ...data,
                date: new Date(),
              };
              mockDocuments.push(newItem);
            } else if (table === mockDb._tables.auditLogs) {
              newItem = {
                id: nextAuditLogId++,
                ...data,
                date: new Date(),
              };
              mockAuditLogs.push(newItem);
            }

            return [newItem];
          },
        };
      },
    };
  },

  update(table: any) {
    return {
      set(updates: any) {
        return {
          where(condition: any) {
            return {
              async returning() {
                let updated: any;

                if (table === mockDb._tables.users) {
                  const index = mockUsers.findIndex((u) =>
                    this.matchCondition(u, condition),
                  );
                  if (index !== -1) {
                    mockUsers[index] = { ...mockUsers[index], ...updates };
                    updated = mockUsers[index];
                  }
                } else if (table === mockDb._tables.documents) {
                  const index = mockDocuments.findIndex((d) =>
                    this.matchCondition(d, condition),
                  );
                  if (index !== -1) {
                    mockDocuments[index] = {
                      ...mockDocuments[index],
                      ...updates,
                    };
                    updated = mockDocuments[index];
                  }
                }

                return updated ? [updated] : [];
              },
              matchCondition(item: any, condition: any) {
                // Simplified condition matching
                return true; // Will match first item for now
              },
            };
          },
        };
      },
    };
  },

  delete(table: any) {
    return {
      where(condition: any) {
        return {
          async execute() {
            if (table === mockDb._tables.documents) {
              const initialLength = mockDocuments.length;
              mockDocuments = mockDocuments.filter((_, i) => i !== 0); // Remove first for simplicity
              return { rowCount: initialLength - mockDocuments.length };
            }
            return { rowCount: 0 };
          },
          then(resolve: any) {
            return this.execute().then(resolve);
          },
        };
      },
    };
  },

  // Store table references
  _tables: {
    users: Symbol("users"),
    documents: Symbol("documents"),
    auditLogs: Symbol("auditLogs"),
  },
};
