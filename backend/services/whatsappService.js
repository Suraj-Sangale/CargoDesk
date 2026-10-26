import { Twilio } from "twilio";
import { normalizePhoneNumber } from "./smsService";
import {
  getWhatsAppGatewayStatus,
  sendGatewayWhatsAppMessage,
} from "./whatsappGateway";

const TWILIO_CONCURRENCY_LIMIT = 5;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 600;

/**
 * Normalizes phone number into clean WhatsApp international format (digits only, e.g., 919876543210)
 * and e164 format (+919876543210).
 */
export function formatWhatsAppNumber(rawNumber, defaultCountryCode = "+91") {
  const { isValid, normalized, original } = normalizePhoneNumber(
    rawNumber,
    "e164",
    defaultCountryCode
  );

  if (!isValid || !normalized) {
    return { isValid: false, e164: null, digitsOnly: null, original };
  }

  const digitsOnly = normalized.replace(/\+/g, "");
  return {
    isValid: true,
    e164: normalized,
    digitsOnly,
    original,
  };
}

/**
 * Generates a direct WhatsApp Web / Mobile Click-to-Chat URL
 * @param {string} phone - Phone number
 * @param {string} message - Message text
 * @returns {string|null} WhatsApp URL
 */
export function getDirectWhatsAppUrl(phone, message = "") {
  const formatted = formatWhatsAppNumber(phone);
  if (!formatted.isValid || !formatted.digitsOnly) return null;
  const encodedText = encodeURIComponent(message || "");
  return `https://api.whatsapp.com/send?phone=${formatted.digitsOnly}&text=${encodedText}`;
}

/**
 * Dispatches bulk WhatsApp messages through Self-Hosted Baileys Gateway.
 */
async function dispatchSelfHostedWhatsAppBulk(numbers, message) {
  const sent = [];
  const failed = [];

  for (let i = 0; i < numbers.length; i++) {
    const num = numbers[i];
    try {
      const result = await sendGatewayWhatsAppMessage(num, message);
      if (result.success) {
        sent.push(result);
      } else {
        failed.push(result);
      }
    } catch (err) {
      failed.push({
        to: num,
        error: err.message || "Failed to send message via self-hosted gateway",
      });
    }

    // Gentle delay between messages to avoid rate limits & maintain safety
    if (i < numbers.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  return {
    sent,
    failed,
    sentCount: sent.length,
    failedCount: failed.length,
    provider: "self_hosted_gateway",
  };
}

/**
 * Dispatches bulk WhatsApp messages through Twilio API fallback (only if explicitly enabled).
 */
export async function dispatchTwilioWhatsAppBulk(numbers, message) {
  const accountSid = process.env.ACCOUNT_SID;
  const authToken = process.env.AUTH_TOKEN;
  const fromNumber =
    process.env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_SENDER_PHONE_NO;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error(
      "Twilio WhatsApp configuration missing. Please link your phone using the Self-Hosted WhatsApp QR Gateway or configure Twilio."
    );
  }

  const client = new Twilio(accountSid, authToken);
  const results = [];

  for (let i = 0; i < numbers.length; i += TWILIO_CONCURRENCY_LIMIT) {
    const chunk = numbers.slice(i, i + TWILIO_CONCURRENCY_LIMIT);
    const chunkPromises = chunk.map(async (num) => {
      const from = fromNumber.startsWith("whatsapp:")
        ? fromNumber
        : `whatsapp:${fromNumber}`;
      const to = num.startsWith("whatsapp:") ? num : `whatsapp:${num}`;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const res = await client.messages.create({
            body: message,
            from,
            to,
          });
          return { success: true, to: num, sid: res.sid };
        } catch (err) {
          if (attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
            continue;
          }
          return { success: false, to: num, error: err.message };
        }
      }
    });

    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
  }

  const sent = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  return {
    sent,
    failed,
    sentCount: sent.length,
    failedCount: failed.length,
    provider: "twilio",
  };
}

/**
 * Main dispatcher to send Bulk WhatsApp messages.
 * Uses 100% Free Self-Hosted Gateway -> Only calls Twilio if explicitly WHATSAPP_PROVIDER=twilio.
 */
export async function sendBulkWhatsApp({ message, contacts = [] }) {
  if (!message || typeof message !== "string" || !message.trim()) {
    return {
      status: false,
      message: "Message text cannot be empty.",
    };
  }

  if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
    return {
      status: false,
      message: "At least one contact or recipient number is required.",
    };
  }

  const uniqueRawContacts = Array.from(
    new Set(
      contacts
        .map((c) => (typeof c === "string" ? c.trim() : String(c).trim()))
        .filter(Boolean)
    )
  );

  const validNumbers = [];
  const invalidNumbers = [];
  const directLinks = [];

  for (const raw of uniqueRawContacts) {
    const formatted = formatWhatsAppNumber(raw);
    if (formatted.isValid && formatted.e164) {
      validNumbers.push(formatted.e164);
      directLinks.push({
        phone: formatted.e164,
        digits: formatted.digitsOnly,
        url: getDirectWhatsAppUrl(formatted.digitsOnly, message.trim()),
      });
    } else {
      invalidNumbers.push(raw);
    }
  }

  const uniqueValidNumbers = Array.from(new Set(validNumbers));

  if (uniqueValidNumbers.length === 0) {
    return {
      status: false,
      channel: "whatsapp",
      message: `None of the provided numbers are valid (${invalidNumbers.length} invalid).`,
      data: {
        total: uniqueRawContacts.length,
        sentCount: 0,
        failedCount: 0,
        invalidCount: invalidNumbers.length,
        invalidNumbers,
        sent: [],
        failed: [],
        directLinks: [],
      },
    };
  }

  // 1. Check if Self-Hosted Free Gateway is active and connected
  const gatewayStatus = await getWhatsAppGatewayStatus();
  let dispatchResult;
  let activeProvider = "self_hosted_gateway";

  if (gatewayStatus.isConnected) {
    dispatchResult = await dispatchSelfHostedWhatsAppBulk(
      uniqueValidNumbers,
      message.trim()
    );
  } else if (
    process.env.WHATSAPP_PROVIDER === "twilio" &&
    process.env.ACCOUNT_SID &&
    process.env.AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_FROM
  ) {
    activeProvider = "twilio";
    try {
      dispatchResult = await dispatchTwilioWhatsAppBulk(
        uniqueValidNumbers,
        message.trim()
      );
    } catch (err) {
      dispatchResult = {
        sent: [],
        failed: [{ error: err.message }],
        sentCount: 0,
        failedCount: uniqueValidNumbers.length,
      };
    }
  } else {
    // Self-Hosted Gateway not connected yet -> notify user to scan QR code
    return {
      status: false,
      channel: "whatsapp",
      provider: "self_hosted_gateway",
      message:
        "WhatsApp Gateway is not linked yet. Please click 'Link WhatsApp (Free QR)' at the top of the page to scan the QR code with your phone (100% Free).",
      data: {
        total: uniqueRawContacts.length,
        sentCount: 0,
        failedCount: uniqueValidNumbers.length,
        invalidCount: invalidNumbers.length,
        invalidNumbers,
        sent: [],
        failed: [
          {
            error:
              "WhatsApp Gateway disconnected. Please click 'Link WhatsApp (Free QR)' to link your phone.",
          },
        ],
        directLinks,
        needsQrScan: true,
      },
    };
  }

  const { sent, failed, sentCount, failedCount } = dispatchResult;
  const invalidCount = invalidNumbers.length;
  const total = uniqueRawContacts.length;

  let overallStatus = sentCount > 0;
  let summaryMessage = "";

  if (sentCount === total && invalidCount === 0) {
    summaryMessage = `Successfully sent WhatsApp message to all ${sentCount} recipient${sentCount > 1 ? "s" : ""} via Free WhatsApp Gateway!`;
  } else if (sentCount > 0) {
    summaryMessage = `Sent WhatsApp message to ${sentCount} of ${total} recipient${total > 1 ? "s" : ""}.${failedCount > 0 ? ` ${failedCount} failed.` : ""}`;
  } else {
    overallStatus = false;
    const firstError = failed[0]?.error || "Failed to send WhatsApp messages.";
    summaryMessage = `Failed to send WhatsApp messages: ${firstError}`;
  }

  return {
    status: overallStatus,
    channel: "whatsapp",
    provider: activeProvider,
    isPartial: sentCount > 0 && (failedCount > 0 || invalidCount > 0),
    message: summaryMessage,
    data: {
      total,
      sentCount,
      failedCount,
      invalidCount,
      invalidNumbers,
      sent,
      failed,
      directLinks,
    },
  };
}
