import nodemailer from "nodemailer";

/**
 * Creates a configured Nodemailer transport based on environment variables.
 * Supports standard SMTP, Gmail, AWS SES, or any custom mail relay.
 */
function createMailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER || process.env.MAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.MAIL_PASS;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  console.log("🚀 ~ host:", host, user, secure)
  if (user && pass) {
    return nodemailer.createTransport({
      // host,
      port,
      secure,
       service: "gmail",
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === "production",
      },
    });
  }

  return null;
}

/**
 * Sends a 4-digit OTP email to the registered user.
 *
 * @param {string} toEmail - Recipient email address
 * @param {string|number} otp - 4-digit OTP
 * @returns {Promise<{ success: boolean, messageId?: string, mode: string }>}
 */
export async function sendOtpEmail(toEmail, otp) {
  const cleanEmail = String(toEmail).trim().toLowerCase();
  const transporter = createMailTransporter();
  const fromAddress =
    process.env.SMTP_FROM ||
    process.env.EMAIL_FROM ||
    `"CargoDesk Security" <no-reply@cargodesk.com>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>CargoDesk Password Reset</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #f4f7fc;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
          }
          .container {
            max-width: 520px;
            margin: 30px auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
          }
          .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
            padding: 28px 24px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.5px;
          }
          .header p {
            color: #bfdbfe;
            margin: 6px 0 0 0;
            font-size: 13px;
          }
          .content {
            padding: 32px 28px;
            text-align: center;
          }
          .title {
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 12px;
          }
          .message {
            font-size: 14px;
            color: #475569;
            line-height: 1.6;
            margin-bottom: 24px;
          }
          .otp-badge {
            display: inline-block;
            background: #f1f5f9;
            border: 2px dashed #2563eb;
            color: #1e3a8a;
            font-size: 34px;
            font-weight: 800;
            letter-spacing: 10px;
            padding: 14px 28px;
            border-radius: 12px;
            margin: 8px 0 24px 0;
            user-select: all;
          }
          .warning {
            font-size: 12px;
            color: #64748b;
            background: #f8fafc;
            border-radius: 8px;
            padding: 12px 16px;
            border: 1px solid #e2e8f0;
            line-height: 1.5;
            text-align: left;
          }
          .footer {
            border-top: 1px solid #f1f5f9;
            padding: 16px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            background: #ffffff;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>CargoDesk</h1>
            <p>Fleet & Logistics Management System</p>
          </div>
          <div class="content">
            <div class="title">Password Reset Request</div>
            <p class="message">
              We received a request to reset your password for your CargoDesk account.
              Use the 4-digit verification code below to proceed:
            </p>
            <div class="otp-badge">${otp}</div>
            <div class="warning">
              <strong>Notice:</strong> This code is valid for <strong>10 minutes</strong> and can only be used once. If you did not request a password reset, you can safely ignore this email; your account remains secure.
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} CargoDesk. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `CargoDesk Password Reset Request\n\nYour 4-digit verification code is: ${otp}\n\nThis code is valid for 10 minutes. If you did not request this, please ignore this email.`;

  // 1. Try sending via configured SMTP
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to: cleanEmail,
        subject: "Your CargoDesk Password Reset Code",
        text: textContent,
        html: htmlContent,
      });

      console.log(`[EMAIL DISPATCH] Password reset OTP sent to ${cleanEmail} (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId, mode: "smtp" };
    } catch (err) {
      console.error(`[EMAIL ERROR] Failed to send email via SMTP to ${cleanEmail}:`, err?.message);
      // Fall through to dev logger if not in strict production
      if (process.env.NODE_ENV === "production") {
        throw new Error("Failed to dispatch password reset email via SMTP server.");
      }
    }
  }

  // 2. Local development fallback: Log OTP prominently to console for testing
  console.log(`
============================================================
[CARGODESK DEV EMAIL DISPATCH]
To: ${cleanEmail}
Subject: Your CargoDesk Password Reset Code
4-Digit OTP: ${otp}
Notice: Valid for 10 minutes. Configure SMTP_HOST, SMTP_USER,
SMTP_PASS in .env for production email delivery.
============================================================
  `);

  return { success: true, mode: "development" };
}

