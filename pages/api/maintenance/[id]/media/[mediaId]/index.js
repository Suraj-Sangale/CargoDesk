import { deleteMaintenanceMediaController } from "@/backend/controllers/fleetMaintenanceController";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).json({ status: false, message: `Method ${req.method} Not Allowed` });
  }

  const { id, mediaId } = req.query;
  const result = await deleteMaintenanceMediaController(id, mediaId, req);
  return res.status(result.code || (result.status ? 200 : 400)).json(result);
}
