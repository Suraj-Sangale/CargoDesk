import { addNewFleetController } from "@/backend/controllers/fleetController";

export default function handler(req, res) {
  return new Promise((resolve) => {
    const request = req.body;
    addNewFleetController(request)
      .then((result) => {
        res.status(200).json(result);
        resolve(result);
      })
      .catch((error) => {
        res.status(200).json({
          status: false,
          error: error?.message || "Failed to add fleet vehicle",
        });
        resolve();
      });
  });
}
