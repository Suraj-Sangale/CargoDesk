import crypto from "crypto";
import executeQuery from "@/helpers/dbConnection";
import { hashWithSHA256 } from "@/utilities/utils";
import { sendOtpEmail } from "../services/emailService";

let isTableChecked = false;

/**
 * Ensures the password_resets table exists in the database.
 */
export async function ensurePasswordResetsTable() {
  if (isTableChecked) return;
  isTableChecked = true;

  try {
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) NOT NULL,
        otp_hash VARCHAR(255) NOT NULL,
        reset_token VARCHAR(255) NULL,
        attempts INT DEFAULT 0,
        is_verified TINYINT(1) DEFAULT 0,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_reset_token (reset_token)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await executeQuery(createTableSql);
  } catch (err) {
    console.warn("ensurePasswordResetsTable notice:", err?.message);
  }
}

/**
 * Derives a secure HMAC hash for an OTP code using the application SECRET_KEY.
 *
 * @param {string|number} otp - Plain 4-digit OTP
 * @returns {string} - Hex-encoded hash
 */
function hashOtp(otp) {
  const secret = process.env.SECRET_KEY || "cargodesk-otp-internal-salt";
  return crypto.createHmac("sha256", secret).update(String(otp)).digest("hex");
}

/**
 * Initiates a password reset request:
 * 1. Checks if the user exists in `users` table.
 * 2. Checks cooldown/rate limit (minimum 60 seconds between OTP requests).
 * 3. Generates a 4-digit cryptographically secure OTP.
 * 4. Stores hashed OTP in `password_resets` table (expires in 10 minutes).
 * 5. Sends OTP via email service.
 *
 * @param {string} email
 * @returns {Promise<{ status: boolean, message: string }>}
 */
export async function sendPasswordResetOtp(email) {
  console.log("🚀 ~ email:", email)
  // await ensurePasswordResetsTable();

  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { status: false, message: "A valid email address is required" };
  }

  // 1. Verify user exists in database
  const userRows = await executeQuery(
    "SELECT userId, firstName, status FROM users WHERE email = ? LIMIT 1",
    [cleanEmail]
  );
  console.log("🚀 ~ userRows:", userRows)

  // Generic response to prevent user email enumeration
  if (!userRows || userRows.length === 0) {
    return {
      status: true,
      message: "If that email is registered, a 4-digit verification code has been sent.",
    };
  }

  const user = userRows[0];
  if (String(user.status) === "0") {
    return {
      status: false,
      message: "This account is inactive. Please contact your administrator.",
    };
  }

  // 2. Rate-limiting check: Has an OTP been requested within the last 60 seconds?
  const recentRows = await executeQuery(
    "SELECT id, created_at FROM password_resets WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND) ORDER BY id DESC LIMIT 1",
    [cleanEmail]
  );
  console.log("🚀 ~ recentRows:", recentRows)

  if (recentRows && recentRows.length > 0) {
    return {
      status: false,
      message: "Please wait at least 60 seconds before requesting a new verification code.",
    };
  }

  // 3. Invalidate previous active OTPs for this email
  await executeQuery("DELETE FROM password_resets WHERE email = ?", [cleanEmail]);

  // 4. Generate 4-digit cryptographically secure numeric OTP (1000 - 9999)
  const otpNumber = crypto.randomInt(1000, 10000);
  console.log("🚀 ~ otpNumber:", otpNumber)
  const otpHashed = hashOtp(otpNumber);

  // 5. Store in database with MySQL-native 10-minute expiry
  await executeQuery(
    "INSERT INTO password_resets (email, otp_hash, attempts, is_verified, expires_at) VALUES (?, ?, 0, 0, DATE_ADD(NOW(), INTERVAL 10 MINUTE))",
    [cleanEmail, otpHashed]
  );

  // 6. Send OTP via email
  console.log("🚀 ~ otpNumber:", otpNumber)
  console.log("🚀 ~ cleanEmail:", cleanEmail)
  try {
    await sendOtpEmail(cleanEmail, otpNumber);
  } catch (emailErr) {
    console.error("Failed to send OTP email:", emailErr);
    return {
      status: false,
      message: "Failed to dispatch verification email. Please try again later.",
    };
  }

  return {
    status: true,
    message: "A 4-digit verification code has been sent to your registered email.",
  };
}

/**
 * Verifies the 4-digit OTP entered by the user:
 * 1. Checks if record exists and is not expired.
 * 2. Checks maximum allowed attempts (5 attempts max to prevent brute force).
 * 3. Compares hashes.
 * 4. On success: generates a single-use reset_token valid for 15 minutes.
 *
 * @param {string} email
 * @param {string|number} otp
 * @returns {Promise<{ status: boolean, message: string, resetToken?: string }>}
 */
export async function verifyPasswordResetOtp(email, otp) {
  await ensurePasswordResetsTable();

  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanOtp = String(otp || "").trim();

  if (!cleanEmail || !cleanOtp) {
    return { status: false, message: "Email and 4-digit OTP are required" };
  }

  if (!/^\d{4}$/.test(cleanOtp)) {
    return { status: false, message: "Please enter a valid 4-digit code" };
  }

  // 1. Fetch active reset record
  const rows = await executeQuery(
    "SELECT id, otp_hash, attempts, is_verified, expires_at, (expires_at < NOW()) AS is_expired FROM password_resets WHERE email = ? ORDER BY id DESC LIMIT 1",
    [cleanEmail]
  );

  if (!rows || rows.length === 0) {
    return {
      status: false,
      message: "No verification request found. Please request a new code.",
    };
  }

  const record = rows[0];

  // 2. Check if expired
  if (Boolean(record.is_expired)) {
    await executeQuery("DELETE FROM password_resets WHERE id = ?", [record.id]);
    return {
      status: false,
      message: "This verification code has expired. Please request a new one.",
    };
  }

  // 3. Brute force check: Maximum 5 attempts
  if (record.attempts >= 5) {
    await executeQuery("DELETE FROM password_resets WHERE id = ?", [record.id]);
    return {
      status: false,
      message: "Too many incorrect attempts. For security, please request a new verification code.",
    };
  }

  // 4. Verify OTP hash
  const inputHash = hashOtp(cleanOtp);
  if (inputHash !== record.otp_hash) {
    const newAttempts = record.attempts + 1;
    await executeQuery(
      "UPDATE password_resets SET attempts = ? WHERE id = ?",
      [newAttempts, record.id]
    );

    const remaining = 5 - newAttempts;
    return {
      status: false,
      message: remaining > 0
        ? `Incorrect code. ${remaining} attempt${remaining > 1 ? "s" : ""} remaining.`
        : "Too many incorrect attempts. Please request a new verification code.",
    };
  }

  // 5. OTP verified: Generate single-use reset token valid for 15 minutes
  const resetToken = crypto.randomBytes(32).toString("hex");

  await executeQuery(
    "UPDATE password_resets SET is_verified = 1, reset_token = ?, expires_at = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id = ?",
    [resetToken, record.id]
  );

  return {
    status: true,
    message: "Code verified successfully.",
    resetToken,
  };
}

/**
 * Resets the user's password:
 * 1. Validates the resetToken and email against the database.
 * 2. Checks token expiration and verification status.
 * 3. Validates new password strength (minimum 8 characters).
 * 4. Hashes the new password with SHA256 (system standard).
 * 5. Updates `users` table and consumes/deletes the reset record.
 *
 * @param {string} email
 * @param {string} resetToken
 * @param {string} newPassword
 * @returns {Promise<{ status: boolean, message: string }>}
 */
export async function resetUserPassword(email, resetToken, newPassword) {
  await ensurePasswordResetsTable();

  const cleanEmail = (email || "").trim().toLowerCase();
  const token = (resetToken || "").trim();
  const password = (newPassword || "").trim();

  if (!cleanEmail || !token || !password) {
    return { status: false, message: "Missing required reset information" };
  }

  if (password.length < 8) {
    return {
      status: false,
      message: "Password must be at least 8 characters long",
    };
  }

  // 1. Verify resetToken in database
  const rows = await executeQuery(
    "SELECT id, is_verified, (expires_at < NOW()) AS is_expired FROM password_resets WHERE email = ? AND reset_token = ? LIMIT 1",
    [cleanEmail, token]
  );

  if (!rows || rows.length === 0) {
    return {
      status: false,
      message: "Invalid or expired reset session. Please restart the forgot password process.",
    };
  }

  const record = rows[0];

  if (!record.is_verified || Boolean(record.is_expired)) {
    await executeQuery("DELETE FROM password_resets WHERE id = ?", [record.id]);
    return {
      status: false,
      message: "This password reset session has expired. Please request a new code.",
    };
  }

  // 2. Hash new password with SHA256 (application standard)
  const hashedPassword = hashWithSHA256(password);

  // 3. Update password in users table
  const updateResult = await executeQuery(
    "UPDATE users SET password = ? WHERE email = ?",
    [hashedPassword, cleanEmail]
  );

  if (!updateResult || updateResult.affectedRows === 0) {
    return {
      status: false,
      message: "User account could not be found to update password.",
    };
  }

  // 4. Invalidate and consume the reset record
  await executeQuery("DELETE FROM password_resets WHERE email = ?", [cleanEmail]);

  return {
    status: true,
    message: "Password has been successfully reset. Please log in with your new password.",
  };
}
