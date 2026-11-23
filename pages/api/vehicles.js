import executeQuery from "@/helpers/dbConnection";
import { getAuthUserFromReq } from "@/utilities/authServer";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ status: false, message: `Method ${req.method} Not Allowed` });
  }

  const authUser = getAuthUserFromReq(req);
  if (!authUser) {
    return res.status(401).json({ status: false, message: "Unauthorized. Please log in." });
  }

  try {
    // Dynamically identify organization from session or profile
    let orgId = authUser.orgId ? Number(authUser.orgId) : null;
    if (!orgId && authUser.userId) {
      const uRows = await executeQuery(
        "SELECT orgId FROM users WHERE userId = ? LIMIT 1",
        [authUser.userId]
      );
      if (uRows?.[0]?.orgId) {
        orgId = Number(uRows[0].orgId);
      }
    }

    const isSupervisor = authUser.role === "maintenance_supervisor";
    const isSuperAdmin =
      authUser.role === "super_admin" || authUser.email === "suraj@agnibyte.com";

    // Maintenance Supervisor must belong to an organization to see fleets
    if (isSupervisor && !orgId) {
      return res.status(200).json({
        status: true,
        data: [],
        message: "No organization associated with this supervisor account.",
      });
    }

    const searchVal = req.body?.search || req.query?.search;
    const search = searchVal ? String(searchVal).trim() : "";
    const requestedOrgId = req.body?.orgId || req.query?.orgId;

    const whereClauses = [];
    const params = [];

    // 1. Organization filtering
    if (isSupervisor) {
      // Strictly restrict maintenance supervisor to their organization's fleets
      whereClauses.push("orgId = ?");
      params.push(orgId);
    } else if (isSuperAdmin) {
      // Super admin can optionally filter by orgId or view all
      if (requestedOrgId) {
        whereClauses.push("orgId = ?");
        params.push(Number(requestedOrgId));
      }
    } else if (orgId) {
      // Regular tenant users scoped to their organization
      whereClauses.push("orgId = ?");
      params.push(orgId);
    }

    // 2. Search query filtering
    if (search) {
      whereClauses.push("(vehicle_number LIKE ? OR vehicle_model LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
    const sql = `
      SELECT id, orgId, vehicle_number, vehicle_model, vehicle_type, status
      FROM fleets
      ${whereSQL}
      ORDER BY vehicle_number ASC
    `;

    const rows = await executeQuery(sql, params);
    return res.status(200).json({
      status: true,
      data: Array.isArray(rows) ? rows : [],
      message: "Vehicles fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching vehicles list:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to fetch vehicles list",
    });
  }
}
