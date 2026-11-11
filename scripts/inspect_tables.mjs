import fs from 'fs';
import mysql from 'serverless-mysql';

const envPath = fs.existsSync('.env.local') ? '.env.local' : '.env';
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [k, ...v] = trimmed.split('=');
    if (k) envVars[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const db = mysql({
  config: {
    host: envVars.MYSQL_HOST || 'localhost',
    port: Number(envVars.MYSQL_PORT || 3306),
    database: envVars.MYSQL_DATABASE || 'cargodesk',
    user: envVars.MYSQL_USER || 'root',
    password: envVars.MYSQL_PASSWORD || '',
  }
});

async function main() {
  const tables = await db.query('SHOW TABLES');
  console.log('TABLES:', tables);
  const fleetCols = await db.query('DESCRIBE fleets');
  console.log('FLEETS COLS:', fleetCols.map(c => `${c.Field} (${c.Type})`));

  const userCols = await db.query('DESCRIBE users');
  console.log('USERS COLS:', userCols.map(c => `${c.Field} (${c.Type})`));

  const docCols = await db.query('DESCRIBE vehicle_documents');
  console.log('VEHICLE_DOCUMENTS COLS:', docCols.map(c => `${c.Field} (${c.Type})`));

  // Check if orgId exists on drivers, backfill null orgId
  const colRows = await db.query("SHOW COLUMNS FROM drivers LIKE 'orgId'");
  console.log("DRIVER orgId col:", colRows);
  await db.query(`
    UPDATE drivers d 
    LEFT JOIN fleets f ON d.fleet_id = f.id 
    SET d.orgId = COALESCE(f.orgId, 1) 
    WHERE d.orgId IS NULL OR d.orgId = 0
  `);

  const updatedDrivers = await db.query(`
    SELECT 
      d.id, d.driver_name, d.orgId, o.orgName, d.fleet_id, f.vehicle_number
    FROM drivers d
    LEFT JOIN organizations o ON o.orgId = d.orgId
    LEFT JOIN fleets f ON d.fleet_id = f.id
  `);
  console.log("UPDATED DRIVERS WITH ORG:", updatedDrivers);

  try {
    const mediaCols = await db.query('DESCRIBE fleet_maintenance_media');
    console.log('FLEET_MAINTENANCE_MEDIA COLS:', mediaCols);
  } catch (e) {
    console.log('fleet_maintenance_media table does not exist yet');
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
