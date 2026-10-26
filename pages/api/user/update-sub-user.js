import { updateUserController } from "@/backend/controllers/userController";
import { getAuthUserFromReq } from "@/utilities/authServer";

export default function handler(req, res) {
  return new Promise((resolve) => {
    const request = req.body;
    const authUser = getAuthUserFromReq(req);

    updateUserController(request, authUser)
      .then((result) => {
        res.status(200).json(result);
        resolve();
      })
      .catch((error) => {
        res.status(200).json({
          status: false,
          error: error?.message || "Failed to update sub-user",
        });
        resolve();
      });
  });
}
