import executeQuery from "@/helpers/dbConnection";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ status: false, message: `Method ${req.method} Not Allowed` });
  }

  try {
    const searchVal = req.body?.search || req.query?.search;
    const search = searchVal ? String(searchVal).trim() : "";
    let sql = `
      SELECT id, vehicle_number, vehicle_model, vehicle_type, status
      FROM fleets
    `;
    const params = [];

    if (search) {
      sql += " WHERE vehicle_number LIKE ? OR vehicle_model LIKE ?";
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += " ORDER BY vehicle_number ASC";

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
