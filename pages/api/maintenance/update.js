import { updateMaintenanceController } from "@/backend/controllers/fleetMaintenanceController";

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "PUT" && req.method !== "PATCH") {
    res.setHeader("Allow", ["POST", "PUT", "PATCH"]);
    return res.status(405).json({ status: false, message: `Method ${req.method} Not Allowed` });
  }

  const id = req.body?.id || req.query?.id;
  const result = await updateMaintenanceController(id, req);
  return res.status(result.code || (result.status ? 200 : 400)).json(result);
}

