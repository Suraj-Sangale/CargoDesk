import { getAllVehicleDocumentsController } from "@/backend/controllers/vehicleDocumentController";
import { getAuthUserFromReq } from "@/utilities/authServer";

export default function handler(req, res) {
  return new Promise((resolve) => {
    const response = {
      status: false,
    };

    let requestBody = {};
    if (req.body) {
      try {
        requestBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      } catch (e) {
        requestBody = {};
      }
    }

    const request = { ...(req.query || {}), ...(requestBody || {}) };
    const authUser = getAuthUserFromReq(req);

    getAllVehicleDocumentsController(request, authUser)
      .then((result) => {
        res.status(200).json(result);
        resolve(result);
      })
      .catch((error) => {
        response.error = error?.message || error;
        res.status(500).json(response);
        resolve();
      });
  });
}
