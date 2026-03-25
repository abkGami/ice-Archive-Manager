import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type LoginInput, type SignupInput } from "@shared/routes";
import { buildApiUrl } from "@/lib/api";

const USER_STORAGE_KEY = "ice-archive-user";

// Helper functions for localStorage
function saveUserToStorage(user: any) {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    console.error("Failed to save user to localStorage:", error);
  }
}

function getUserFromStorage() {
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error("Failed to get user from localStorage:", error);
    return null;
  }
}

function clearUserFromStorage() {
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear user from localStorage:", error);
  }
}

export function useUser() {
  return useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const res = await fetch(buildApiUrl(api.auth.me.path), {
        credentials: "include",
      });
      if (res.status === 401 || res.status === 403) {
        // Clear stored user if server says unauthorized
        clearUserFromStorage();
        return null;
      }
      if (!res.ok) {
        // On any error, clear stale data and return null
        clearUserFromStorage();
        throw new Error("Failed to fetch user");
      }
      const user = api.auth.me.responses[200].parse(await res.json());

      // Save user to localStorage
      saveUserToStorage(user);
      return user;
    },
    retry: false,
    // Initialize with stored user data if available
    initialData: getUserFromStorage,
    staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const res = await fetch(buildApiUrl(api.auth.login.path), {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) {
          const error = api.auth.login.responses[401].parse(await res.json());
          throw new Error(error.message);
        }
        if (res.status === 403) {
          const error = api.auth.login.responses[403].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Login failed");
      }
      return api.auth.login.responses[200].parse(await res.json());
    },
    onSuccess: (user) => {
      // Save user to both React Query cache and localStorage
      queryClient.setQueryData([api.auth.me.path], user);
      saveUserToStorage(user);
    },
    onError: () => {
      // Clear user data on login failure
      clearUserFromStorage();
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(buildApiUrl(api.auth.logout.path), {
        method: api.auth.logout.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Logout failed");
      return api.auth.logout.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      // Clear user data from both React Query cache and localStorage
      queryClient.setQueryData([api.auth.me.path], null);
      queryClient.clear();
      clearUserFromStorage();
    },
    onError: () => {
      // Even if logout fails, clear local data
      queryClient.setQueryData([api.auth.me.path], null);
      queryClient.clear();
      clearUserFromStorage();
    },
  });
}

export function useSignup() {
  return useMutation({
    mutationFn: async (data: SignupInput) => {
      const res = await fetch(buildApiUrl(api.auth.signup.path), {
        method: api.auth.signup.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.auth.signup.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        if (res.status === 409) {
          const error = api.auth.signup.responses[409].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Signup failed");
      }

      return api.auth.signup.responses[201].parse(await res.json());
    },
  });
}

// Utility function to check if user is authenticated (can be used in components)
export function useIsAuthenticated() {
  const { data: user } = useUser();
  return !!user;
}

// Utility function to get user role (can be used for role-based rendering)
export function useUserRole() {
  const { data: user } = useUser();
  return user?.role || null;
}
