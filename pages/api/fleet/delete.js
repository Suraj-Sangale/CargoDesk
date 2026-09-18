import { deleteFleetController } from "@/backend/controllers/fleetController";

export default function handler(req, res) {
  return new Promise((resolve) => {
    const { ids } = req.body || {};
    deleteFleetController(ids)
      .then((result) => {
        res.status(200).json(result);
        resolve(result);
      })
      .catch((error) => {
        res.status(200).json({
          status: false,
          error: error?.message || "Failed to delete fleet vehicle(s)",
        });
        resolve();
      });
  });
}
