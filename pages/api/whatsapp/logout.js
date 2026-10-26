import { clearWhatsAppCredentials } from "@/backend/services/whatsappGateway";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ status: false, message: "Method Not Allowed" });
  }

  try {
    await clearWhatsAppCredentials();
    return res.status(200).json({
      status: true,
      message: "WhatsApp session logged out and credentials cleared.",
    });
  } catch (error) {
    console.error("Error logging out WhatsApp gateway:", error);
    return res.status(500).json({
      status: false,
      message: error?.message || "Failed to log out WhatsApp gateway.",
    });
  }
}
