import Cookies from "cookies";

export default async function handler(req, res) {
  const cookies = new Cookies(req, res, {
    secure: process.env.NODE_ENV === "production",
  });

  // Delete the auth_token cookie with immediate expiration
  cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    maxAge: 0,
    path: "/",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  });

  // Also set header explicitly as a fallback
  res.setHeader(
    "Set-Cookie",
    "auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; SameSite=Lax"
  );

  res.status(200).json({ status: true, message: "Logged out successfully" });
}
