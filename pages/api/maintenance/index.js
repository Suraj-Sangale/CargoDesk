import { createMaintenanceController } from "@/backend/controllers/fleetMaintenanceController";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const result = await createMaintenanceController(req);
    return res.status(result.code || (result.status ? 201 : 400)).json(result);
  }

  res.setHeader("Allow", ["POST"]);
  return res.status(405).json({ status: false, message: `Method ${req.method} Not Allowed` });
}
