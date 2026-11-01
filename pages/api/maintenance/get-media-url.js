import { getMediaSignedUrlController } from "@/backend/controllers/fleetMaintenanceController";

export default async function handler(req, res) {
  const maintenanceId = req.body?.maintenanceId || req.body?.id || req.query?.id;
  const mediaId = req.body?.mediaId || req.query?.mediaId;

  const result = await getMediaSignedUrlController(maintenanceId, mediaId, req);
  return res.status(result.code || (result.status ? 200 : 400)).json(result);
}

