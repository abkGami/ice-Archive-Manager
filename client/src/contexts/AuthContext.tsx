import { createContext, useContext, useEffect, ReactNode } from "react";
import { useUser } from "@/hooks/use-auth";
import { useLocation } from "wouter";

interface AuthContextType {
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading, error } = useUser();
  const [location, setLocation] = useLocation();
  const isAuthenticated = !!user && !error;

  useEffect(() => {
    // If user is not authenticated and not on public routes, redirect to login
    const publicRoutes = ["/login", "/signup"];
    const isPublicRoute = publicRoutes.includes(location);

    if (!isLoading && !isAuthenticated && !isPublicRoute) {
      setLocation("/login");
    }
  }, [isAuthenticated, isLoading, location, setLocation]);

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
