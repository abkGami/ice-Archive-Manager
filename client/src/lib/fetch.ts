import { buildApiUrl } from "./api";

// Store for tracking if we've already redirected to login to prevent loops
let isRedirectingToLogin = false;

/**
 * Wrapper around fetch that automatically handles authentication errors
 * and redirects to login when the session expires
 */
export async function authenticatedFetch(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  const response = await fetch(buildApiUrl(url), {
    ...options,
    credentials: "include", // Always include cookies
  });

  // Handle authentication errors
  if (response.status === 401 && !isRedirectingToLogin) {
    isRedirectingToLogin = true;

    // Clear any stored user data
    try {
      localStorage.removeItem("ice-archive-user");
    } catch (error) {
      console.error("Failed to clear user from localStorage:", error);
    }

    // Redirect to login only if not already on login/signup pages
    const currentPath = window.location.pathname;
    const publicPaths = ["/login", "/signup"];

    if (!publicPaths.includes(currentPath)) {
      window.location.href = "/login";
    }
  }

  return response;
}
