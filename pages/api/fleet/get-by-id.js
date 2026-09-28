import { getFleetByIdController } from "@/backend/controllers/fleetController";

export default function handler(req, res) {
  const fleetId = req.query.id || req.query.fleetId || req.body?.id || req.body?.fleetId;

  if (!fleetId) {
    return res.status(400).json({ status: false, message: "Missing required fleet id" });
  }

  return new Promise((resolve) => {
    getFleetByIdController(fleetId)
      .then((result) => {
        if (result?.status) {
          res.status(200).json(result);
        } else {
          res.status(404).json(result);
        }
        resolve(result);
      })
      .catch((error) => {
        res.status(500).json({
          status: false,
          error: error?.message || "Failed to fetch fleet details",
        });
        resolve();
      });
  });
}
