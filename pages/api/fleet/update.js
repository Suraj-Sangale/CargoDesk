import { updateFleetController } from "@/backend/controllers/fleetController";
import { getAuthUserFromReq } from "@/utilities/authServer";

export default function handler(req, res) {
  return new Promise((resolve) => {
    const request = req.body;
    const authUser = getAuthUserFromReq(req);
    updateFleetController(request, authUser)
      .then((result) => {
        res.status(200).json(result);
        resolve(result);
      })
      .catch((error) => {
        res.status(200).json({
          status: false,
          error: error?.message || "Failed to update fleet vehicle",
        });
        resolve();
      });
  });
}
