import { deleteFleetController } from "@/backend/controllers/fleetController";
import { getAuthUserFromReq } from "@/utilities/authServer";

export default function handler(req, res) {
  return new Promise((resolve) => {
    const { ids } = req.body || {};
    const authUser = getAuthUserFromReq(req);
    deleteFleetController(ids, authUser)
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
