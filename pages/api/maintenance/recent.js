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
    const limit = Math.min(20, Math.max(1, parseInt(req.query?.limit || req.body?.limit, 10) || 5));

    const sql = `
      SELECT 
        m.id,
        m.vehicle_id,
        m.maintenance_type,
        m.description,
        m.maintenance_date,
        m.status,
        m.cost,
        m.created_at,
        f.vehicle_number,
        f.vehicle_model,
        f.vehicle_type,
        (SELECT COUNT(*) FROM fleet_maintenance_media WHERE maintenance_id = m.id) AS media_count
      FROM fleet_maintenance m
      LEFT JOIN fleets f ON f.id = m.vehicle_id
      ORDER BY m.id DESC
      LIMIT ?
    `;

    const rows = await executeQuery(sql, [limit]);

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

