import { sendPasswordResetOtp } from "@/backend/models/passwordResetModel";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      status: false,
      message: `Method ${req.method} Not Allowed`,
    });
  }

  try {
    console.log("🚀 ~ req.body:", req.body)
    const { email } = req.body || {};

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({
        status: false,
        message: "Please provide a valid email address.",
      });
    }

    const result = await sendPasswordResetOtp(email);

    if (result.status) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error in send-otp handler:", error);
    return res.status(500).json({
      status: false,
      message: "An internal server error occurred while sending the OTP.",
    });
  }
}

