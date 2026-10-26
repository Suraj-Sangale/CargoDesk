import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import { getSafeRedirectUrl, hasRequiredRole } from "./authConfig";

export function clearAuthCookie(res) {
  if (!res) return;
  res.setHeader(
    "Set-Cookie",
    serialize("auth_token", "", {
      path: "/",
      expires: new Date(0),
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
    })
  );
}

export function redirectToLogin(res, targetUrl = "") {
  if (res) {
    clearAuthCookie(res);
  }

  const safeTarget = getSafeRedirectUrl(targetUrl, "");
  const queryParam =
    safeTarget && safeTarget !== "/" && !safeTarget.startsWith("/login")
      ? `?redirect=${encodeURIComponent(safeTarget)}`
      : "";

  return {
    redirect: {
      destination: `/login${queryParam}`,
      permanent: false,
    },
  };
}

/**
 * Fast synchronous JWT cookie authentication for SSR with 0ms database latency.
 * Verifies cryptographic JWT signature and token expiration.
 *
 * @param {object} context - Next.js GetServerSidePropsContext
 * @param {string[]|string|null} allowedRoles - Optional required roles
 * @returns {object} { user } or { redirect }
 */
export function requireValidUser(context, allowedRoles = null) {
  const req = context?.req;
  const res = context?.res;
  const resolvedUrl = context?.resolvedUrl || req?.url || "/";

  // 1. Fast direct cookie extraction from headers/cookies
  const cookieHeader = req?.headers?.cookie || "";
  let token = req?.cookies?.auth_token;

  if (!token && cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]+)/);
    if (match) {
      token = decodeURIComponent(match[1]);
    }
  }

  if (!token || token.trim() === "") {
    return redirectToLogin(res, resolvedUrl);
  }

  // 2. Cryptographic JWT signature and expiration verification
  try {
    const secret = process.env.SECRET_KEY
    const decoded = jwt.verify(token, secret);

    if (!decoded || !decoded.userId) {
      return redirectToLogin(res, resolvedUrl);
    }

    const user = {
      userId: decoded.userId,
      firstName: decoded.firstName || "",
      lastName: decoded.lastName || "",
      email: decoded.email || "",
      role: decoded.role || "user",
      phone: decoded.phone || "",
      orgId: decoded.orgId ? Number(decoded.orgId) : null,
    };

    // 3. Role-based authorization check
    if (allowedRoles && !hasRequiredRole(user.role, allowedRoles)) {
      return {
        redirect: {
          destination: "/403",
          permanent: false,
        },
      };
    }

    return { user };
  } catch (err) {
    // Expired, tampered, or invalid token -> clear cookie and redirect
    return redirectToLogin(res, resolvedUrl);
  }
}

/**
 * Extracts and verifies the authenticated user from an incoming API request.
 * @param {object} req - Next.js API request object
 * @returns {object|null} Decoded user token payload or null
 */
export function getAuthUserFromReq(req) {
  try {
    let token = req?.cookies?.auth_token;
    const cookieHeader = req?.headers?.cookie || "";

    if (!token && cookieHeader) {
      const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]+)/);
      if (match) {
        token = decodeURIComponent(match[1]);
      }
    }

    if (!token) return null;
    const secret = process.env.SECRET_KEY;
    const decoded = jwt.verify(token, secret);
    if (!decoded || !decoded.userId) return null;
    return {
      ...decoded,
      orgId: decoded.orgId ? Number(decoded.orgId) : null,
    };
  } catch (_) {
    return null;
  }
}
