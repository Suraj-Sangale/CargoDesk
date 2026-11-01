import { getMaintenanceListByVehicleController } from "@/backend/controllers/fleetMaintenanceController";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ status: false, message: `Method ${req.method} Not Allowed` });
  }

  const { vehicleId } = req.query;
  const result = await getMaintenanceListByVehicleController(vehicleId, req.query, req);
  return res.status(result.code || (result.status ? 200 : 400)).json(result);
}
