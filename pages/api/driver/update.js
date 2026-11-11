import { updateDriverController } from "@/backend/controllers/driverController";
import { getAuthUserFromReq } from "@/utilities/authServer";

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
    const authUser = getAuthUserFromReq(req);

    updateDriverController(request, authUser)
      .then((result) => {
        res.status(200).json(result);
        resolve(result);
      })
      .catch((error) => {
        res.status(200).json({
          status: false,
          error: error?.message || "Failed to update driver",
        });
        resolve();
      });
  });
}
