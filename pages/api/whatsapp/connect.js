import { initWhatsAppGateway } from "@/backend/services/whatsappGateway";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ status: false, message: "Method Not Allowed" });
  }

  try {
    const { forceReconnect = false } = req.body || {};
    await initWhatsAppGateway(forceReconnect);
    return res.status(200).json({
      status: true,
      message: "WhatsApp Gateway initialization triggered.",
    });
  } catch (error) {
    console.error("Error connecting WhatsApp gateway:", error);
    return res.status(500).json({
      status: false,
      message: error?.message || "Failed to initialize WhatsApp gateway.",
    });
  }
}
