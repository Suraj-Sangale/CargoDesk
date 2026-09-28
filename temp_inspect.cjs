const fs = require('fs');
const mysql = require('serverless-mysql');

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, "");
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
  console.log('--- ALL Vehicle Documents ---');
  const docs = await db.query('SELECT * FROM vehicle_documents');
  console.log(JSON.stringify(docs, null, 2));

  console.log('--- ALL Fleet Activity History for DOCUMENT ---');
  const activities = await db.query("SELECT * FROM fleet_activity_history WHERE operation_type = 'DOCUMENT'");
  console.log(JSON.stringify(activities, null, 2));

  await db.end();
}

run().catch(e => {
  console.error('ERROR:', e);
  process.exit(1);
});
