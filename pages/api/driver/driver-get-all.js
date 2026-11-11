import { getAllDriversController } from "@/backend/controllers/driverController";
import { getAuthUserFromReq } from "@/utilities/authServer";

export const config = {
  api: {
    responseLimit: false,
  },
};

export default function handler(req, res) {
  return new Promise((resolve) => {
    const request =
      req.method === "POST"
        ? { ...(req.query || {}), ...(req.body || {}) }
        : { ...(req.query || {}) };
    const authUser = getAuthUserFromReq(req);

    getAllDriversController(request, authUser)
      .then((result) => {
        res.status(200).json(result);
        resolve();
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
