import { removeDriverFromFleetController } from "@/backend/controllers/fleetDriverController";

export default function handler(req, res) {
  return new Promise((resolve) => {
    if (req.method !== "POST") {
      res.status(405).json({ status: false, message: "Method not allowed" });
      return resolve();
    }

    const request = req.body || {};
    removeDriverFromFleetController(request)
      .then((result) => {
        res.status(200).json(result);
        resolve(result);
      })
      .catch((error) => {
        res.status(200).json({
          status: false,
          message: error?.message || "Failed to remove assignment",
        });
        resolve();
      });
  });
}
