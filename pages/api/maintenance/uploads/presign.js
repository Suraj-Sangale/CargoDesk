import { presignMaintenanceUploadsController } from "@/backend/controllers/fleetMaintenanceController";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ status: false, message: `Method ${req.method} Not Allowed` });
  }

  const result = await presignMaintenanceUploadsController(req);
  return res.status(result.code || (result.status ? 200 : 400)).json(result);
}
