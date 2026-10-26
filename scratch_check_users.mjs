import fs from "fs";
import path from "path";
import mysql from "serverless-mysql";

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
  host: envVars.MYSQL_HOST || "localhost",
  port: Number(envVars.MYSQL_PORT || 3306),
  database: envVars.MYSQL_DATABASE || "cargodesk",
  user: envVars.MYSQL_USER || "root",
  password: envVars.MYSQL_PASSWORD || "",
  timezone: "IST",
};

const db = mysql({ config });

async function checkUsers() {
  try {
    const cols = await db.query("DESCRIBE users");
    console.log("USERS COLUMNS:", cols);
    const users = await db.query("SELECT userId, firstName, lastName, email, phone, role, status FROM users");
    console.log("CURRENT USERS:", users);
    await db.end();
  } catch (err) {
    console.error("Error:", err);
    await db.end();
  }
}

checkUsers();
