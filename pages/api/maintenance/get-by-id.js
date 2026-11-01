import { getMaintenanceByIdController } from "@/backend/controllers/fleetMaintenanceController";

export default async function handler(req, res) {
  const id = req.body?.id || req.query?.id;
  const result = await getMaintenanceByIdController(id);
  return res.status(result.code || (result.status ? 200 : 400)).json(result);
}

