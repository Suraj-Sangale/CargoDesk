import { verifyUserModel } from "@/backend/models/userModel";
import Cookies from "cookies";
import jwt from "jsonwebtoken"; // Import JWT library

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { email_id, password } = req.body;

    try {
      // Verify user credentials
      const response = await verifyUserModel(email_id, password);

      if (response.status) {
        const user = response.user; // Get the user role or any other user data you want to store in the token
        // Successful login
        const token = jwt.sign(
          {
            userId: user.userId,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            orgId: user.orgId ? Number(user.orgId) : null,
          },
          process.env.SECRET_KEY,
          { expiresIn: "1d" }
        );

        // Set the JWT token in the cookies
        const cookies = new Cookies(req, res, {
          secure: process.env.NODE_ENV === "production",
        });

        cookies.set("auth_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 24 * 60 * 60 * 1000,
          path: "/",
          sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        });

        // Respond with success
        res.status(200).json({
          status: true,
          message: "Login successful",
          user: response.user,
          userId: response.userId,
        });
      } else {
        // If login fails
        res.status(401).json({ message: response.message });
      }
    } catch (error) {
      // Server error handling
      console.error("Login error:", error);
      res.status(500).json({
        message: `Server error while genrating toke ${error}, ${process.env.NODE_ENV}`,
      });
    }
  } else {
    // Handle method not allowed
    res.status(501).json({ message: `Method Not Allowed ${req.method}` });
  }
}
