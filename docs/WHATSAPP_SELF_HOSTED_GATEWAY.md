# 🚀 Self-Hosted Free WhatsApp Gateway Documentation

## 1. Overview

CargoDesk includes a **100% Free, Self-Hosted WhatsApp Gateway** powered by [`@whiskeysockets/baileys`](https://github.com/WhiskeySockets/Baileys). 

### Why this approach?
- **Zero Fees / No Subscriptions**: Completely eliminates monthly Twilio or Meta WhatsApp charges.
- **No Headless Browser / Puppeteer**: Connects directly via lightweight WebSockets to the WhatsApp Multi-Device protocol (<15MB RAM usage).
- **Persistent Session**: You scan a QR code once with your phone, and credentials are securely cached in `auth_info_baileys/` for seamless auto-reconnections.
- **Unified Multi-Channel**: Send messages via **WhatsApp**, **SMS**, or **Both** concurrently from the CargoDesk dashboard.

---

## 2. Architecture & Workflow

```
                   ┌──────────────────────────────────────┐
                   │    CargoDesk Web UI (Composer)       │
                   └──────────────────┬───────────────────┘
                                      │
                   ┌──────────────────▼───────────────────┐
                   │   POST /api/sendMessage              │
                   │   (channel: 'whatsapp' | 'both')     │
                   └──────────────────┬───────────────────┘
                                      │
                   ┌──────────────────▼───────────────────┐
                   │ backend/services/whatsappService.js  │
                   └──────────────────┬───────────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
      [Gateway Connected]                        [Gateway Disconnected]
                 │                                         │
┌─────────────────────────────────┐      ┌───────────────────────────────────┐
│ backend/whatsappGateway.js      │      │ Direct Click-to-Chat Fallback     │
│ (Baileys Multi-Device Socket)   │      │ https://wa.me/919876543210?text=  │
│ ➔ Automated Background Dispatch │      └───────────────────────────────────┘
└─────────────────────────────────┘
```

---

## 3. How to Connect Your WhatsApp Account

### Step 1: Open the Messaging Page
Navigate to **Send a Message** (`/messager`) in CargoDesk.

### Step 2: Click "Link WhatsApp (Free QR)"
In the top-right corner of the **Message Composer** card:
1. Click the **"Link WhatsApp (Free QR)"** button.
2. A modal will appear displaying a live QR code.

### Step 3: Scan with Your Phone
1. Open **WhatsApp** on your mobile device (Android or iOS).
2. Go to **Settings** (iOS) or **Menu (⋮)** (Android).
3. Tap **Linked Devices** &rarr; **Link a Device**.
4. Point your camera at the QR code in CargoDesk.

Once scanned, the status badge turns **🟢 Linked (+91 9876543210)** and the modal will automatically update!

---

## 4. Sending WhatsApp Messages

### Option A: Automated Bulk Background Sending
1. In the composer, select **WhatsApp** or **🚀 Both** (SMS & WhatsApp).
2. Type your message or select a pre-saved template.
3. Select contacts or recipient groups.
4. Click **Send via WhatsApp** or **Send SMS & WhatsApp**.
5. CargoDesk dispatches the messages sequentially in the background with real-time batch progress.

### Option B: Quick Click-to-Chat (Individual or Selected Contacts)
1. Next to each contact in the right-hand recipient panel, click the green **WhatsApp icon** (`FaWhatsapp`).
2. Or select multiple contacts and click **"WhatsApp (X)"** in the panel footer.
3. This opens WhatsApp Web or your WhatsApp Desktop/Mobile app directly with the phone number and pre-filled message.

---

## 5. API Reference

### 1. `GET /api/whatsapp/status`
Returns the current connection state of the WhatsApp socket.

#### Response:
```json
{
  "status": true,
  "data": {
    "isConnected": true,
    "isConnecting": false,
    "status": "connected",
    "phone": "919876543210",
    "userName": "CargoDesk Fleet Admin",
    "qrCode": null,
    "lastError": null
  }
}
```

---

### 2. `POST /api/whatsapp/connect`
Triggers socket initialization and generates a new Base64 QR code image.

#### Request:
```json
{
  "forceReconnect": true
}
```

#### Response:
```json
{
  "status": true,
  "message": "WhatsApp Gateway initialization triggered."
}
```

---

### 3. `POST /api/whatsapp/logout`
Disconnects the active WhatsApp session and clears local authentication keys from `auth_info_baileys/`.

#### Response:
```json
{
  "status": true,
  "message": "WhatsApp session logged out and credentials cleared."
}
```

---

### 4. `POST /api/sendMessage`
Dispatches SMS, WhatsApp, or Both channels.

#### Request:
```json
{
  "channel": "whatsapp",
  "message": "Hello {name}, your vehicle MH12AB1234 fitness is due for renewal.",
  "contacts": ["9876543210", "9123456789"]
}
```

#### Response:
```json
{
  "status": true,
  "channel": "whatsapp",
  "provider": "self_hosted_gateway",
  "message": "Successfully sent WhatsApp message to all 2 recipients via Free WhatsApp Gateway!",
  "data": {
    "total": 2,
    "sentCount": 2,
    "failedCount": 0,
    "invalidCount": 0,
    "sent": [
      { "success": true, "to": "919876543210", "messageId": "BAE5F1..." },
      { "success": true, "to": "919123456789", "messageId": "BAE5F2..." }
    ]
  }
}
```

---

## 6. Best Practices for Account Safety (Anti-Spam Guidelines)

To maintain a healthy WhatsApp account when sending automated operational messages (PUC alerts, fleet updates, driver dispatch):

1. **Pacing**: CargoDesk includes a built-in safety interval (~800ms) between outgoing messages to emulate natural human sending cadence.
2. **Personalization**: Use dynamic variables like `{name}`, `{vehicleNo}`, and `{date}` so each message has unique content.
3. **Recipient Consent**: Only send operational updates to verified contacts/drivers in your fleet database.
4. **Session Persistence**: Do not frequently unlink and relink devices; keep the session active in `auth_info_baileys/`.

---

## 7. Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **QR Code expired** | QR codes expire after 30 seconds if not scanned. | Click **"Refresh QR Code"** in the modal. |
| **"Gateway is not connected" error** | The device session was logged out from your phone. | Open the modal and scan the QR code to re-link. |
| **Invalid Number format** | Number is missing country code or contains letters. | CargoDesk automatically normalizes 10-digit numbers with India code (`+91`), but make sure international numbers include country codes. |
