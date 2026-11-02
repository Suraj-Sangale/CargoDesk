import { verifyPasswordResetOtp } from "@/backend/models/passwordResetModel";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      status: false,
      message: `Method ${req.method} Not Allowed`,
    });
  }

  try {
    const { email, otp } = req.body || {};

    if (!email || !otp) {
      return res.status(400).json({
        status: false,
        message: "Email and 4-digit code are required.",
      });
    }

    const result = await verifyPasswordResetOtp(email, otp);

    if (result.status) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error in verify-otp handler:", error);
    return res.status(500).json({
      status: false,
      message: "An internal server error occurred while verifying the code.",
    });
  }
}

