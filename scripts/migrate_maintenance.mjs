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
    timezone: 'IST',
  }
});

async function migrate() {
  console.log('Running Fleet Maintenance database migration...');

  // 1. Table fleet_maintenance
  const createMaintenanceTableSQL = `
    CREATE TABLE IF NOT EXISTS fleet_maintenance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      vehicle_id INT NOT NULL,
      maintenance_type VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      maintenance_date DATE NOT NULL,
      odometer_reading INT NULL,
      cost DECIMAL(12, 2) NULL DEFAULT 0.00,
      garage_name VARCHAR(150) NULL,
      invoice_number VARCHAR(100) NULL,
      additional_notes TEXT NULL,
      status ENUM('Reported', 'In Progress', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Reported',
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_vehicle_date (vehicle_id, maintenance_date),
      INDEX idx_status (status),
      CONSTRAINT fk_maintenance_vehicle FOREIGN KEY (vehicle_id) REFERENCES fleets(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  // 2. Table fleet_maintenance_media
  const createMediaTableSQL = `
    CREATE TABLE IF NOT EXISTS fleet_maintenance_media (
      id INT AUTO_INCREMENT PRIMARY KEY,
      maintenance_id INT NOT NULL,
      s3_key VARCHAR(500) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      file_size BIGINT NOT NULL,
      media_type ENUM('image', 'video', 'document') NOT NULL DEFAULT 'image',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_maintenance (maintenance_id),
      INDEX idx_s3_key (s3_key(191)),
      CONSTRAINT fk_media_maintenance FOREIGN KEY (maintenance_id) REFERENCES fleet_maintenance(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await db.query(createMaintenanceTableSQL);
    console.log('Table fleet_maintenance created/verified successfully.');

    await db.query(createMediaTableSQL);
    console.log('Table fleet_maintenance_media created/verified successfully.');

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
