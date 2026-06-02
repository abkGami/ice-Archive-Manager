import type { Document, User, AuditLog } from "@shared/schema";

const CACHE_PREFIX = "ice_archive_cache_";
const CACHE_VERSION = "v1";

interface CacheData<T> {
  data: T;
  timestamp: number;
  version: string;
}

export class OfflineStorage {
  private static getKey(key: string): string {
    return `${CACHE_PREFIX}${CACHE_VERSION}_${key}`;
  }

  static saveDocuments(documents: Document[]): void {
    try {
      const cacheData: CacheData<Document[]> = {
        data: documents,
        timestamp: Date.now(),
        version: CACHE_VERSION,
      };
      localStorage.setItem(
        this.getKey("documents"),
        JSON.stringify(cacheData)
      );
    } catch (error) {
      console.error("Failed to cache documents:", error);
    }
  }

  static getDocuments(): Document[] | null {
    try {
      const cached = localStorage.getItem(this.getKey("documents"));
      if (!cached) return null;

      const cacheData: CacheData<Document[]> = JSON.parse(cached);
      
      // Cache valid for 24 hours
      const isExpired = Date.now() - cacheData.timestamp > 24 * 60 * 60 * 1000;
      if (isExpired) {
        this.clearDocuments();
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.error("Failed to load cached documents:", error);
      return null;
    }
  }

  static clearDocuments(): void {
    try {
      localStorage.removeItem(this.getKey("documents"));
    } catch (error) {
      console.error("Failed to clear cached documents:", error);
    }
  }

  static saveUsers(users: User[]): void {
    try {
      const cacheData: CacheData<User[]> = {
        data: users,
        timestamp: Date.now(),
        version: CACHE_VERSION,
      };
      localStorage.setItem(this.getKey("users"), JSON.stringify(cacheData));
    } catch (error) {
      console.error("Failed to cache users:", error);
    }
  }

  static getUsers(): User[] | null {
    try {
      const cached = localStorage.getItem(this.getKey("users"));
      if (!cached) return null;

      const cacheData: CacheData<User[]> = JSON.parse(cached);
      
      const isExpired = Date.now() - cacheData.timestamp > 24 * 60 * 60 * 1000;
      if (isExpired) {
        this.clearUsers();
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.error("Failed to load cached users:", error);
      return null;
    }
  }

  static clearUsers(): void {
    try {
      localStorage.removeItem(this.getKey("users"));
    } catch (error) {
      console.error("Failed to clear cached users:", error);
    }
  }

  static saveAuditLogs(logs: AuditLog[]): void {
    try {
      const cacheData: CacheData<AuditLog[]> = {
        data: logs,
        timestamp: Date.now(),
        version: CACHE_VERSION,
      };
      localStorage.setItem(this.getKey("audit_logs"), JSON.stringify(cacheData));
    } catch (error) {
      console.error("Failed to cache audit logs:", error);
    }
  }

  static getAuditLogs(): AuditLog[] | null {
    try {
      const cached = localStorage.getItem(this.getKey("audit_logs"));
      if (!cached) return null;

      const cacheData: CacheData<AuditLog[]> = JSON.parse(cached);
      
      const isExpired = Date.now() - cacheData.timestamp > 24 * 60 * 60 * 1000;
      if (isExpired) {
        this.clearAuditLogs();
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.error("Failed to load cached audit logs:", error);
      return null;
    }
  }

  static clearAuditLogs(): void {
    try {
      localStorage.removeItem(this.getKey("audit_logs"));
    } catch (error) {
      console.error("Failed to clear cached audit logs:", error);
    }
  }

  static clearAll(): void {
    this.clearDocuments();
    this.clearUsers();
    this.clearAuditLogs();
  }
}
