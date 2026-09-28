const fs = require('fs');
const mysql = require('serverless-mysql');

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    if (key && !key.startsWith('#')) env[key] = val;
  }
});

const db = mysql({
  config: {
    host: env.MYSQL_HOST || env.DB_HOST || 'localhost',
    port: Number(env.MYSQL_PORT || env.DB_PORT || 3306),
    database: env.MYSQL_DATABASE || env.DB_NAME || env.DB_DATABASE || 'cargodesk',
    user: env.MYSQL_USER || env.DB_USER || env.DB_USERNAME || 'root',
    password: env.MYSQL_PASSWORD || env.DB_PASSWORD || '',
    timezone: 'IST',
  },
});

async function run() {
  const fleetId = 6;
  const fleetRows = await db.query('SELECT * FROM fleets WHERE id = ?', [fleetId]);
  const fleet = fleetRows[0];
  console.log('Fleet:', fleet);

  const docQuery = `SELECT * FROM vehicle_documents WHERE fleet_id = ? OR (fleet_id IS NULL AND REPLACE(REPLACE(vehicleNo, ' ', ''), '-', '') COLLATE utf8mb4_general_ci = REPLACE(REPLACE(?, ' ', ''), '-', '') COLLATE utf8mb4_general_ci) ORDER BY id DESC`;
  const docs = await db.query(docQuery, [fleet.id, fleet.vehicle_number]);
  console.log('Docs fetched by getFleetByIdModel:', docs);

  // Check activity history for fleetId = 6
  const actSummaryQuery = `
    SELECT 
      COUNT(*) AS total_all,
      SUM(CASE WHEN operation_type = 'DOCUMENT' THEN 1 ELSE 0 END) AS count_documents,
      SUM(CASE WHEN operation_type = 'DRIVER' THEN 1 ELSE 0 END) AS count_driver,
      SUM(CASE WHEN operation_type = 'EMI' THEN 1 ELSE 0 END) AS count_emi,
      SUM(CASE WHEN operation_type = 'MAINTENANCE' THEN 1 ELSE 0 END) AS count_maintenance,
      SUM(CASE WHEN operation_type = 'FLEET' THEN 1 ELSE 0 END) AS count_vehicle_details,
      SUM(CASE WHEN operation_type = 'STATUS' OR action IN ('ACTIVATE', 'DEACTIVATE') OR entity_type = 'STATUS_CHANGE' THEN 1 ELSE 0 END) AS count_status
    FROM fleet_activity_history
    WHERE fleet_id = ?
  `;
  const actSummary = await db.query(actSummaryQuery, [fleetId]);
  console.log('Act Summary:', actSummary);

  const actData = await db.query('SELECT * FROM fleet_activity_history WHERE fleet_id = ? ORDER BY performed_at DESC, id DESC', [fleetId]);
  console.log('Act Data count:', actData.length);
  console.log('Act Data:', actData);

  await db.end();
}

run().catch(e => {
  console.error('ERROR:', e);
  process.exit(1);
});
