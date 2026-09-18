import { addNewDriverController } from "@/backend/controllers/driverController";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "25mb",
    },
  },
};

export default function handler(req, res) {
  return new Promise((resolve) => {
    const request = req.body;
    addNewDriverController(request)
      .then((result) => {
        res.status(200).json(result);
        resolve(result);
      })
      .catch((error) => {
        res.status(200).json({
          status: false,
          error: error?.message || "Failed to add driver",
        });
        resolve();
      });
  });
}
