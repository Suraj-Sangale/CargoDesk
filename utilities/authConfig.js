/**
 * Centralized Authentication and Route Protection Configuration
 */

// Public routes accessible without authentication
export const PUBLIC_ROUTES = [
  "/login",
  "/sign-up",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/404",
  "/500",
  "/403",
];

// Route prefix patterns that are public
export const PUBLIC_ROUTE_PREFIXES = [
  "/public/",
  "/_next/",
  "/api/",
  "/favicon.ico",
  "/sitemap.xml",
  "/robots.txt",
];

/**
 * Checks if a given pathname matches any public route or prefix.
 * @param {string} pathname
 * @returns {boolean}
 */
export function isPublicRoute(pathname = "") {
  if (!pathname || typeof pathname !== "string") return false;

  // Exact public route match
  if (PUBLIC_ROUTES.includes(pathname)) {
    return true;
  }

  // Dynamic public routes (e.g. /reset-password/:token)
  if (pathname.startsWith("/reset-password/")) {
    return true;
  }

  // Public prefixes (static assets, api, etc.)
  for (const prefix of PUBLIC_ROUTE_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return true;
    }
  }

  return false;
}

/**
 * Validates and sanitizes redirect URLs to strictly allow only internal paths,
 * preventing Open Redirect vulnerabilities.
 * @param {string} url - The candidate redirect URL
 * @param {string} defaultPath - Fallback destination if invalid
 * @returns {string} Safe relative destination
 */
export function getSafeRedirectUrl(url, defaultPath = "/") {
  if (!url || typeof url !== "string") return defaultPath;

  const trimmed = url.trim();

  // Must begin with a single '/' and not '//' or '/\'
  if (
    trimmed.startsWith("/") &&
    !trimmed.startsWith("//") &&
    !trimmed.startsWith("/\\") &&
    !trimmed.includes(":") && // Block protocol schemas like http:, javascript:, etc.
    !trimmed.startsWith("/login") // Prevent redirecting back to login
  ) {
    return trimmed;
  }

  return defaultPath;
}

/**
 * Validates if a user has one of the allowed roles.
 * @param {string} userRole
 * @param {string[]|string} allowedRoles
 * @returns {boolean}
 */
export function hasRequiredRole(userRole, allowedRoles) {
  if (!allowedRoles || (Array.isArray(allowedRoles) && allowedRoles.length === 0)) {
    return true;
  }

  if (typeof allowedRoles === "string") {
    return userRole === allowedRoles;
  }

  if (Array.isArray(allowedRoles)) {
    return allowedRoles.includes(userRole);
  }

  return false;
}
