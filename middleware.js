import { NextResponse } from "next/server";
import { isPublicRoute, getSafeRedirectUrl } from "./utilities/authConfig";

export function middleware(req) {
  const { pathname, search } = req.nextUrl;
  const authToken = req.cookies.get("auth_token");
  const hasAuthToken = Boolean(authToken && authToken.value && authToken.value.trim() !== "");

  const isAuthPage = pathname === "/login" || pathname === "/sign-up" || pathname === "/register";

  // 1. If user is authenticated and visits login/register, redirect to requested redirect param or dashboard
  if (hasAuthToken && isAuthPage) {
    const redirectParam = req.nextUrl.searchParams.get("redirect");
    const targetPath = getSafeRedirectUrl(redirectParam, "/");
    return NextResponse.redirect(new URL(targetPath, req.url));
  }

  // 2. If route is public, allow access unconditionally
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // 3. For all protected routes, ensure valid authentication token is present
  if (!hasAuthToken) {
    const requestedPath = pathname + (search || "");
    const redirectTarget =
      requestedPath && requestedPath !== "/"
        ? `/login?redirect=${encodeURIComponent(requestedPath)}`
        : "/login";

    return NextResponse.redirect(new URL(redirectTarget, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (/api/*)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - static image/font extensions
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
