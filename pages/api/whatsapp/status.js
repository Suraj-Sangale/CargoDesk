import { getWhatsAppGatewayStatus } from "@/backend/services/whatsappGateway";

export default async function handler(req, res) {
  try {
    const status = await getWhatsAppGatewayStatus();
    return res.status(200).json({
      status: true,
      data: status,
    });
  } catch (error) {
    console.error("Error fetching WhatsApp status:", error);
    return res.status(500).json({
      status: false,
      message: error?.message || "Failed to fetch WhatsApp gateway status.",
    });
  }
}
