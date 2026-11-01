import { getMaintenanceListByVehicleController } from "@/backend/controllers/fleetMaintenanceController";

export default async function handler(req, res) {
  const vehicleId = req.body?.vehicleId || req.body?.vehicle_id || req.query?.vehicleId || req.query?.vehicle_id;
  const query = { ...req.query, ...(req.body || {}) };

  const result = await getMaintenanceListByVehicleController(vehicleId, query, req);
  return res.status(result.code || (result.status ? 200 : 400)).json(result);
}

