import { parseCookies } from "nookies";
import { serialize } from "cookie";
import { getCurrentToken } from "@/utilities/utils";
import { getUserDetailsById } from "@/backend/controllers/userController";

export function clearAuthCookie(res) {
  res.setHeader(
    "Set-Cookie",
    serialize("auth_token", "", {
      path: "/",
      expires: new Date(0),
      httpOnly: true,
      sameSite: "lax",
    })
  );
}

export function redirectToLogin(res) {
  if (res) {
    clearAuthCookie(res);
  }
  return {
    redirect: {
      destination: "/login",
      permanent: false,
    },
  };
}

// Ensures there's a valid token and user in DB; returns user or a redirect object
export async function requireValidUser(context) {
  const cookies = parseCookies(context);
  const token = cookies.auth_token;
  const res = context?.res;

  if (!token) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const decoded = getCurrentToken(token);
  if (!decoded) {
    return redirectToLogin(res);
  }
  console.log("decoded====", decoded);
  // Prefer user claims from JWT to avoid DB call when available
  if (decoded.userId && decoded.email && decoded.firstName && decoded.role) {
    return {
      user: {
        userId: decoded.userId,
        firstName: decoded.firstName || "",
        lastName: decoded.lastName || "",
        email: decoded.email || "",
        role: decoded.role || "",
        status: decoded.status || "",
      },
    };
  }

  // Fallback to DB lookup if token lacks required user claims
  const userDetails = await getUserDetailsById(decoded.userId);
  if (!userDetails?.status || !userDetails.data) {
    return redirectToLogin(res);
  }

  return {
    user: {
      userId: userDetails.data.userId,
      firstName: userDetails.data.firstName || "",
      lastName: userDetails.data.lastName || "",
      email: userDetails.data.email || "",
      role: userDetails.data.role || "",
      status: userDetails.data.status || "",
    },
  };
}
