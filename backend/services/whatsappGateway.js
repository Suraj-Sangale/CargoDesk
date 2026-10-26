import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import pino from "pino";
import path from "path";
import fs from "fs";

// Auth credentials directory for persistent login
const AUTH_DIR = path.join(process.cwd(), "auth_info_baileys");

// Global gateway state cache across Next.js API calls
if (!global.__whatsappGatewayState) {
  global.__whatsappGatewayState = {
    socket: null,
    isConnected: false,
    isConnecting: false,
    qrCodeDataUrl: null,
    rawQr: null,
    user: null,
    lastError: null,
    connectionStatus: "disconnected", // "disconnected" | "connecting" | "qr_ready" | "connected"
  };
}

const state = global.__whatsappGatewayState;

/**
 * Initializes or retrieves the self-hosted WhatsApp socket connection.
 */
export async function initWhatsAppGateway(forceReconnect = false) {
  if (state.socket && state.isConnected && !forceReconnect) {
    return state;
  }

  if (state.isConnecting && !forceReconnect) {
    return state;
  }

  if (forceReconnect && state.socket) {
    try {
      state.socket.end(new Error("Force reconnecting"));
    } catch (_) {}
    state.socket = null;
  }

  state.isConnecting = true;
  state.connectionStatus = "connecting";
  state.lastError = null;

  try {
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    const { state: authState, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    const logger = pino({ level: "silent" }); // Silent pino logger

    const sock = makeWASocket({
      version,
      auth: authState,
      logger,
      printQRInTerminal: false,
      browser: ["CargoDesk Logistics", "Chrome", "1.0.0"],
      syncFullHistory: false,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
    });

    state.socket = sock;

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        state.rawQr = qr;
        state.connectionStatus = "qr_ready";
        try {
          state.qrCodeDataUrl = await QRCode.toDataURL(qr, {
            margin: 2,
            scale: 6,
            color: {
              dark: "#0F172A",
              light: "#FFFFFF",
            },
          });
        } catch (qrErr) {
          console.error("Failed to generate QR data URL:", qrErr);
        }
      }

      if (connection === "open") {
        state.isConnected = true;
        state.isConnecting = false;
        state.connectionStatus = "connected";
        state.qrCodeDataUrl = null;
        state.rawQr = null;
        state.user = sock.user || null;
        console.log("✅ [CargoDesk WhatsApp Gateway] Connected successfully as:", sock.user?.id || "Linked Device");
      }

      if (connection === "close") {
        // Only handle close if this is the active socket
        if (state.socket !== sock) return;

        state.isConnected = false;
        state.isConnecting = false;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        state.connectionStatus = shouldReconnect ? "disconnected" : "logged_out";
        state.lastError = lastDisconnect?.error?.message || "Connection closed";

        if (statusCode === DisconnectReason.loggedOut) {
          console.log("⚠️ [CargoDesk WhatsApp Gateway] Device logged out. Clearing credentials.");
          await clearWhatsAppCredentials();
        } else if (shouldReconnect) {
          console.log("🔄 [CargoDesk WhatsApp Gateway] Reconnecting in 3 seconds...");
          setTimeout(() => {
            if (!state.isConnected) {
              initWhatsAppGateway();
            }
          }, 3000);
        }
      }
    });

    return state;
  } catch (err) {
    state.isConnecting = false;
    state.isConnected = false;
    state.connectionStatus = "disconnected";
    state.lastError = err.message;
    console.error("❌ [CargoDesk WhatsApp Gateway] Init failed:", err);
    return state;
  }
}

/**
 * Returns the current status of the WhatsApp gateway.
 */
export async function getWhatsAppGatewayStatus() {
  if (!state.socket && !state.isConnecting) {
    if (fs.existsSync(AUTH_DIR) && fs.readdirSync(AUTH_DIR).length > 0) {
      initWhatsAppGateway();
    }
  }

  const userPhone = state.user?.id ? state.user.id.split(":")[0].split("@")[0] : null;

  return {
    isConnected: Boolean(state.isConnected),
    isConnecting: Boolean(state.isConnecting),
    status: state.connectionStatus,
    qrCode: state.qrCodeDataUrl,
    phone: userPhone,
    userName: state.user?.name || "CargoDesk Gateway",
    lastError: state.lastError,
  };
}

/**
 * Sends a single WhatsApp message via the active Baileys Gateway.
 * @param {string} rawPhone - Recipient phone number (e.g., '919876543210')
 * @param {string} messageText - Message body
 */
export async function sendGatewayWhatsAppMessage(rawPhone, messageText) {
  if (!state.socket || !state.isConnected) {
    throw new Error(
      "WhatsApp Gateway is not connected. Please scan the QR code to link your WhatsApp account."
    );
  }

  // Format recipient into JID format: 919876543210@s.whatsapp.net
  let cleanDigits = String(rawPhone).replace(/[\s\-\(\)\+]/g, "");
  if (cleanDigits.length === 10) {
    cleanDigits = "91" + cleanDigits; // Indian default prefix
  }

  const jid = `${cleanDigits}@s.whatsapp.net`;

  try {
    const sentMsg = await state.socket.sendMessage(jid, {
      text: messageText,
    });

    return {
      success: true,
      to: cleanDigits,
      messageId: sentMsg?.key?.id,
      timestamp: sentMsg?.messageTimestamp,
    };
  } catch (err) {
    console.error(`Failed to send WhatsApp message to ${cleanDigits}:`, err);
    return {
      success: false,
      to: cleanDigits,
      error: err.message || "Failed to deliver message via WhatsApp gateway",
    };
  }
}

/**
 * Disconnects and purges stored authentication keys.
 */
export async function clearWhatsAppCredentials() {
  state.isConnected = false;
  state.isConnecting = false;
  state.connectionStatus = "disconnected";
  state.user = null;
  state.qrCodeDataUrl = null;
  state.rawQr = null;

  if (state.socket) {
    try {
      state.socket.end(new Error("Logged out by user"));
    } catch (_) {}
    state.socket = null;
  }

  if (fs.existsSync(AUTH_DIR)) {
    try {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    } catch (err) {
      console.error("Failed to delete auth_info_baileys folder:", err);
    }
  }

  return { success: true };
}
