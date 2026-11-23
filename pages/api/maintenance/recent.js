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

    // For maintenance supervisors, strictly limit to 5 records and ensure an organization is present
    const limit = isSupervisor
      ? 5
      : Math.min(20, Math.max(1, parseInt(req.query?.limit || req.body?.limit, 10) || 5));

    if (isSupervisor && !orgId) {
      return res.status(200).json({
        status: true,
        data: [],
        message: "No organization associated with this supervisor account.",
      });
    }

    const whereClauses = [];
    const params = [];

    if (isSupervisor) {
      // 1. Must belong to the logged-in supervisor
      whereClauses.push("m.created_by = ?");
      params.push(authUser.userId);

      // 2. Must belong to the supervisor's organization
      whereClauses.push("f.orgId = ?");
      params.push(orgId);
    } else if (isSuperAdmin) {
      const requestedOrgId = req.query?.orgId || req.body?.orgId;
      if (requestedOrgId) {
        whereClauses.push("f.orgId = ?");
        params.push(Number(requestedOrgId));
      }
    } else if (orgId) {
      // Regular tenant users/admins scoped to their organization
      whereClauses.push("f.orgId = ?");
      params.push(orgId);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const sql = `
      SELECT 
        m.id,
        m.vehicle_id,
        m.maintenance_type,
        m.description,
        m.maintenance_date,
        m.status,
        m.cost,
        m.created_by,
        m.created_at,
        f.vehicle_number,
        f.vehicle_model,
        f.vehicle_type,
        (SELECT COUNT(*) FROM fleet_maintenance_media WHERE maintenance_id = m.id) AS media_count
      FROM fleet_maintenance m
      LEFT JOIN fleets f ON f.id = m.vehicle_id
      ${whereSQL}
      ORDER BY m.maintenance_date DESC, m.created_at DESC, m.id DESC
      LIMIT ?
    `;

    params.push(limit);

    const rows = await executeQuery(sql, params);

    return res.status(200).json({
      status: true,
      data: Array.isArray(rows) ? rows : [],
      message: "Recent maintenance records fetched successfully.",
    });
  } catch (error) {
    console.error("Error fetching recent maintenance records:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to fetch recent maintenance records.",
    });
  }
}

