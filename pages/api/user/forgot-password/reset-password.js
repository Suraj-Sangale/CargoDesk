import { resetUserPassword } from "@/backend/models/passwordResetModel";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      status: false,
      message: `Method ${req.method} Not Allowed`,
    });
  }

  try {
    const { email, resetToken, newPassword } = req.body || {};

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({
        status: false,
        message: "Email, reset token, and new password are required.",
      });
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({
        status: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    const result = await resetUserPassword(email, resetToken, newPassword);

    if (result.status) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error in reset-password handler:", error);
    return res.status(500).json({
      status: false,
      message: "An internal server error occurred while resetting the password.",
    });
  }
}

