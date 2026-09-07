import { Twilio } from "twilio";

// Configurable constants
const TWILIO_CONCURRENCY_LIMIT = 5; // Max simultaneous Twilio requests
const FAST2SMS_BATCH_SIZE = 100;    // Max comma-separated numbers per Fast2SMS call
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 600;

/**
 * Normalizes phone numbers for various SMS gateway formats.
 * @param {string|number} rawNumber - Input phone number
 * @param {'e164'|'national10'} targetFormat - Format needed ('e164' for Twilio, 'national10' for Fast2SMS)
 * @param {string} defaultCountryCode - Default country code ('+91')
 */
export function normalizePhoneNumber(
  rawNumber,
  targetFormat = "e164",
  defaultCountryCode = "+91"
) {
  if (!rawNumber || (typeof rawNumber !== "string" && typeof rawNumber !== "number")) {
    return { isValid: false, normalized: null, original: rawNumber };
  }

  const str = String(rawNumber).trim();
  let cleaned = str.replace(/[\s\-\(\)\.]/g, "");

  // Detect and standardize digits
  let national10 = null;
  let e164 = null;

  if (cleaned.startsWith("+")) {
    const digitsOnly = cleaned.slice(1);
    if (/^\d{7,15}$/.test(digitsOnly)) {
      e164 = cleaned;
      if (digitsOnly.startsWith("91") && digitsOnly.length === 12) {
        national10 = digitsOnly.slice(2);
      } else if (digitsOnly.length === 10) {
        national10 = digitsOnly;
      }
    }
  } else if (cleaned.startsWith("00")) {
    const digitsOnly = cleaned.slice(2);
    if (/^\d{7,15}$/.test(digitsOnly)) {
      e164 = "+" + digitsOnly;
      if (digitsOnly.startsWith("91") && digitsOnly.length === 12) {
        national10 = digitsOnly.slice(2);
      }
    }
  } else if (cleaned.startsWith("91") && cleaned.length === 12 && /^[6-9]\d{9}$/.test(cleaned.slice(2))) {
    national10 = cleaned.slice(2);
    e164 = `+${cleaned}`;
  } else if (cleaned.startsWith("0") && cleaned.length === 11 && /^[6-9]\d{9}$/.test(cleaned.slice(1))) {
    national10 = cleaned.slice(1);
    e164 = `${defaultCountryCode}${national10}`;
  } else if (/^[6-9]\d{9}$/.test(cleaned)) {
    national10 = cleaned;
    e164 = `${defaultCountryCode}${cleaned}`;
  } else if (/^\d{10}$/.test(cleaned)) {
    national10 = cleaned;
    e164 = `${defaultCountryCode}${cleaned}`;
  }

  if (targetFormat === "national10") {
    if (national10 && /^\d{10}$/.test(national10)) {
      return { isValid: true, normalized: national10, original: str };
    }
    return { isValid: false, normalized: null, original: str };
  }

  // Default targetFormat === "e164"
  if (e164 && /^\+\d{7,15}$/.test(e164)) {
    return { isValid: true, normalized: e164, original: str };
  }

  return { isValid: false, normalized: null, original: str };
}

/**
 * Sends a single SMS using Twilio with exponential backoff retries.
 */
async function sendTwilioSingleSmsWithRetry(client, fromNumber, toNumber, messageBody) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await client.messages.create({
        body: messageBody,
        from: fromNumber,
        to: toNumber,
      });
      return {
        success: true,
        to: toNumber,
        sid: result.sid,
        status: result.status,
      };
    } catch (err) {
      const isRetryable =
        err.status === 429 ||
        (err.status >= 500 && err.status < 600) ||
        err.code === 20429;

      if (isRetryable && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      return {
        success: false,
        to: toNumber,
        error: err.message || "Failed to send message via Twilio",
        code: err.code || err.status || "UNKNOWN_ERROR",
      };
    }
  }
}

/**
 * Dispatches bulk messages through Twilio using controlled concurrent workers.
 */
async function dispatchTwilioBulk(numbers, message) {
  const accountSid = process.env.ACCOUNT_SID;
  const authToken = process.env.AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_SENDER_PHONE_NO;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error(
      "Twilio configuration missing. Please verify ACCOUNT_SID, AUTH_TOKEN, and TWILIO_SENDER_PHONE_NO in your .env file."
    );
  }

  const client = new Twilio(accountSid, authToken);
  const results = [];

  for (let i = 0; i < numbers.length; i += TWILIO_CONCURRENCY_LIMIT) {
    const chunk = numbers.slice(i, i + TWILIO_CONCURRENCY_LIMIT);
    const chunkPromises = chunk.map((num) =>
      sendTwilioSingleSmsWithRetry(client, fromNumber, num, message)
    );
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);

    if (i + TWILIO_CONCURRENCY_LIMIT < numbers.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  const sent = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  return {
    sent,
    failed,
    sentCount: sent.length,
    failedCount: failed.length,
  };
}

/**
 * Sends a batch of numbers through Fast2SMS with exponential backoff retries.
 */
async function sendFast2SmsBatchWithRetry(apiKey, numbersArray, messageBody) {
  const numbersParam = numbersArray.join(",");
  const payload = {
    route: process.env.FAST2SMS_ROUTE || "q", // "q" (quick SMS) or "dlt"
    message: messageBody,
    language: "english",
    flash: 0,
    numbers: numbersParam,
  };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.return === true) {
        return {
          success: true,
          batchCount: numbersArray.length,
          numbers: numbersArray,
          requestId: data.request_id,
          message: Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "SMS sent successfully.",
        };
      }

      const isRetryable = response.status === 429 || response.status >= 500;
      if (isRetryable && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      return {
        success: false,
        batchCount: numbersArray.length,
        numbers: numbersArray,
        error: Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message || `Fast2SMS error (HTTP ${response.status})`,
      };
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      return {
        success: false,
        batchCount: numbersArray.length,
        numbers: numbersArray,
        error: err.message || "Network error connecting to Fast2SMS",
      };
    }
  }
}

/**
 * Dispatches bulk messages through Fast2SMS in chunked HTTP requests.
 */
async function dispatchFast2SmsBulk(numbers, message) {
  const apiKey =
    process.env.FAST2SMS_API_KEY ||
    process.env.SMS_API_KEY ||
    process.env.NEXT_PUBLIC_SMS_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Fast2SMS API key missing. Please define FAST2SMS_API_KEY in your .env file."
    );
  }

  const sent = [];
  const failed = [];

  for (let i = 0; i < numbers.length; i += FAST2SMS_BATCH_SIZE) {
    const chunk = numbers.slice(i, i + FAST2SMS_BATCH_SIZE);
    const result = await sendFast2SmsBatchWithRetry(apiKey, chunk, message);

    if (result.success) {
      sent.push(
        ...chunk.map((n) => ({
          to: n,
          success: true,
          requestId: result.requestId,
        }))
      );
    } else {
      failed.push({
        numbers: chunk,
        error: result.error,
        success: false,
      });
    }

    if (i + FAST2SMS_BATCH_SIZE < numbers.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  const sentCount = sent.length;
  const failedCount = numbers.length - sentCount;

  return {
    sent,
    failed,
    sentCount,
    failedCount,
  };
}

/**
 * Unified SMS Service dispatcher.
 * Supports configurable providers via SMS_PROVIDER ('twilio' | 'fast2sms') or auto-detection.
 */
export async function sendBulkSms({
  message,
  contacts = [],
  provider = process.env.SMS_PROVIDER,
}) {
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

  // Deduplicate raw contact numbers
  const uniqueRawContacts = Array.from(
    new Set(
      contacts
        .map((c) => (typeof c === "string" ? c.trim() : String(c).trim()))
        .filter(Boolean)
    )
  );

  // Determine active provider: explicit SMS_PROVIDER or auto-detect by credentials
  let selectedProvider = (provider || "").toLowerCase().trim();
  if (!selectedProvider) {
    if (process.env.ACCOUNT_SID && process.env.AUTH_TOKEN) {
      selectedProvider = "twilio";
    } else if (process.env.FAST2SMS_API_KEY) {
      selectedProvider = "fast2sms";
    } else {
      selectedProvider = "twilio"; // default fallback
    }
  }

  // Format numbers according to provider requirements
  const targetFormat = selectedProvider === "fast2sms" ? "national10" : "e164";
  const validNumbers = [];
  const invalidNumbers = [];

  for (const raw of uniqueRawContacts) {
    const { isValid, normalized, original } = normalizePhoneNumber(
      raw,
      targetFormat
    );
    if (isValid && normalized) {
      validNumbers.push(normalized);
    } else {
      invalidNumbers.push(original);
    }
  }

  const uniqueValidNumbers = Array.from(new Set(validNumbers));

  if (uniqueValidNumbers.length === 0) {
    return {
      status: false,
      provider: selectedProvider,
      message: `None of the provided numbers are valid (${invalidNumbers.length} invalid).`,
      data: {
        total: uniqueRawContacts.length,
        sentCount: 0,
        failedCount: 0,
        invalidCount: invalidNumbers.length,
        invalidNumbers,
        sent: [],
        failed: [],
      },
    };
  }

  let dispatchResult;
  try {
    if (selectedProvider === "fast2sms") {
      dispatchResult = await dispatchFast2SmsBulk(
        uniqueValidNumbers,
        message.trim()
      );
    } else if (selectedProvider === "twilio") {
      dispatchResult = await dispatchTwilioBulk(
        uniqueValidNumbers,
        message.trim()
      );
    } else {
      throw new Error(`Unsupported SMS_PROVIDER: "${selectedProvider}". Use "twilio" or "fast2sms".`);
    }
  } catch (err) {
    console.error(`SMS dispatch error (${selectedProvider}):`, err);
    return {
      status: false,
      provider: selectedProvider,
      message: err.message || "Failed to dispatch SMS through provider gateway.",
      data: {
        total: uniqueRawContacts.length,
        sentCount: 0,
        failedCount: uniqueValidNumbers.length,
        invalidCount: invalidNumbers.length,
        invalidNumbers,
        sent: [],
        failed: [{ error: err.message }],
      },
    };
  }

  const { sent, failed, sentCount, failedCount } = dispatchResult;
  const invalidCount = invalidNumbers.length;
  const total = uniqueRawContacts.length;

  let overallStatus = sentCount > 0;
  let summaryMessage = "";

  if (sentCount === total && invalidCount === 0) {
    summaryMessage = `Successfully sent message to all ${sentCount} recipient${sentCount > 1 ? "s" : ""} via ${selectedProvider.toUpperCase()}!`;
  } else if (sentCount > 0) {
    summaryMessage = `Sent to ${sentCount} of ${total} recipient${total > 1 ? "s" : ""} via ${selectedProvider.toUpperCase()}.${failedCount > 0 ? ` ${failedCount} failed.` : ""}${invalidCount > 0 ? ` ${invalidCount} invalid numbers skipped.` : ""}`;
  } else {
    overallStatus = false;
    const firstError = failed[0]?.error || "Failed to send messages.";
    summaryMessage = `Failed to send messages via ${selectedProvider.toUpperCase()}: ${firstError}`;
  }

  return {
    status: overallStatus,
    isPartial: sentCount > 0 && (failedCount > 0 || invalidCount > 0),
    provider: selectedProvider,
    message: summaryMessage,
    data: {
      total,
      sentCount,
      failedCount,
      invalidCount,
      invalidNumbers,
      sent,
      failed,
    },
  };
}
