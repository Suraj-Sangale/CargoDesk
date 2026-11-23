import { getOrganizationDetailsController } from "@/backend/controllers/organizationController";
import { getAuthUserFromReq } from "@/utilities/authServer";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({
      status: false,
      message: `Method ${req.method} Not Allowed`,
    });
  }

  const authUser = getAuthUserFromReq(req);
  if (!authUser) {
    return res.status(401).json({
      status: false,
      message: "Unauthorized. Please log in.",
    });
  }

  const isSuperAdmin =
    authUser.role === "super_admin" || authUser.email === "suraj@agnibyte.com";

  if (!isSuperAdmin) {
    return res.status(403).json({
      status: false,
      message: "Access denied. Organization details are restricted to Super Admin.",
    });
  }

  const orgId =
    req.query?.id ||
    req.query?.orgId ||
    req.body?.id ||
    req.body?.orgId;

  if (!orgId) {
    return res.status(400).json({
      status: false,
      message: "Organization ID is required.",
    });
  }

  try {
    const result = await getOrganizationDetailsController(orgId, authUser);
    const statusCode = result?.status ? 200 : result?.code || 400;
    return res.status(statusCode).json(result);
  } catch (error) {
    console.error("Error in get-by-id organization API:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error fetching organization details.",
    });
  }
}
