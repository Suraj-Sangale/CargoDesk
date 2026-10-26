import { getAllUsersController } from "@/backend/controllers/userController";
import { getAuthUserFromReq } from "@/utilities/authServer";

export default function handler(req, res) {
  return new Promise((resolve) => {
    const authUser = getAuthUserFromReq(req);
    const isSuperAdmin =
      authUser?.role === "super_admin" || authUser?.email === "suraj@agnibyte.com";
    const filterOrgId = isSuperAdmin ? null : authUser?.orgId || null;

    getAllUsersController(filterOrgId)
      .then((result) => {
        res.status(200).json(result);
        resolve();
      })
      .catch((error) => {
        res.status(200).json({
          status: false,
          error: error?.message || "Failed to fetch users",
          data: [],
        });
        resolve();
      });
  });
}
