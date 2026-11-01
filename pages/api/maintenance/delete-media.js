import { deleteMaintenanceMediaController } from "@/backend/controllers/fleetMaintenanceController";

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "DELETE") {
    res.setHeader("Allow", ["POST", "DELETE"]);
    return res.status(405).json({ status: false, message: `Method ${req.method} Not Allowed` });
  }

  const maintenanceId = req.body?.maintenanceId || req.body?.id || req.query?.id;
  const mediaId = req.body?.mediaId || req.query?.mediaId;

  const result = await deleteMaintenanceMediaController(maintenanceId, mediaId, req);
  return res.status(result.code || (result.status ? 200 : 400)).json(result);
}

