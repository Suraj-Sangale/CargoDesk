import sendMessage from "@/backend/controllers/messagerController";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ status: false, message: "Method Not Allowed" });
  }

  try {
    const result = await sendMessage(req.body);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in sendMessage API route:", error);
    return res.status(500).json({
      status: false,
      message: error?.message || "An unexpected error occurred while sending messages.",
    });
  }
}
