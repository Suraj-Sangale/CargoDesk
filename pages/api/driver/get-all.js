import { getAllDriversController } from "@/backend/controllers/driverController";

export default function handler(req, res) {
  return new Promise((resolve) => {
    getAllDriversController()
      .then((result) => {
        res.status(200).json(result);
        resolve(result);
      })
      .catch((error) => {
        res.status(200).json({
          status: false,
          error: error?.message || "Failed to fetch drivers",
        });
        resolve();
      });
  });
}
