import fs from "fs";
import path from "path";
import mysql from "serverless-mysql";

// Load .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";

const envVars = {};
envContent.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const [key, ...vals] = trimmed.split("=");
    if (key) {
      envVars[key.trim()] = vals.join("=").trim().replace(/^["']|["']$/g, "");
    }
  }
});

const config = {
  host: envVars.MYSQL_HOST || envVars.DB_HOST || "localhost",
  port: Number(envVars.MYSQL_PORT || envVars.DB_PORT || 3306),
  database: envVars.MYSQL_DATABASE || envVars.DB_NAME || envVars.DB_DATABASE || "cargodesk",
  user: envVars.MYSQL_USER || envVars.DB_USER || envVars.DB_USERNAME || "root",
  password: envVars.MYSQL_PASSWORD || envVars.DB_PASSWORD || "",
  timezone: "IST",
};

const db = mysql({ config });

async function testGetFleet() {
  try {
    const fleetId = 6;
    const selectQuery = `
      SELECT 
        f.*,
        d.id AS driver_id,
        d.driver_name AS driver_name,
        d.contact_number AS driver_contact,
        d.license_number AS driver_license_number,
        d.license_type AS driver_license_type,
        d.status AS driver_status,
        d.profile_photo AS driver_profile_photo
      FROM fleets f
      LEFT JOIN drivers d ON d.fleet_id = f.id
      WHERE f.id = ?
      LIMIT 1
    `;
    const rows = await db.query(selectQuery, [fleetId]);
    const fleet = rows[0];

    const docQuery = `SELECT * FROM vehicle_documents WHERE fleet_id = ? OR (fleet_id IS NULL AND REPLACE(REPLACE(vehicleNo, ' ', ''), '-', '') = REPLACE(REPLACE(?, ' ', ''), '-', '')) ORDER BY id DESC`;
    const docRows = await db.query(docQuery, [fleet.id, fleet.vehicle_number]);

    console.log("=== FLEET ===", fleet);
    console.log("=== MATCHED DOCUMENTS FOR FLEET 6 ===", docRows);

    process.exit(0);
  } catch (err) {
    console.error("Test error:", err);
    process.exit(1);
  }
}

testGetFleet();
