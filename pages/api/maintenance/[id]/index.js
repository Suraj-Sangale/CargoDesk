import {
  getMaintenanceByIdController,
  updateMaintenanceController,
  deleteMaintenanceRecordController,
} from "@/backend/controllers/fleetMaintenanceController";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "GET") {
    const result = await getMaintenanceByIdController(id);
    return res.status(result.code || (result.status ? 200 : 404)).json(result);
  }

  if (req.method === "PATCH" || req.method === "PUT") {
    const result = await updateMaintenanceController(id, req);
    return res.status(result.code || (result.status ? 200 : 400)).json(result);
  }

  if (req.method === "DELETE") {
    const result = await deleteMaintenanceRecordController(id, req);
    return res.status(result.code || (result.status ? 200 : 400)).json(result);
  }

  res.setHeader("Allow", ["GET", "PATCH", "PUT", "DELETE"]);
  return res.status(405).json({ status: false, message: `Method ${req.method} Not Allowed` });
}
