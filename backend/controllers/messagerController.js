import {
  addNewMessageTemplateModel,
  deleteMessageTemplateModel,
  getUserMessageTemplatesModel,
} from "../models/messangerModel";
import { sendBulkSms } from "../services/smsService";
import { sendBulkWhatsApp } from "../services/whatsappService";

/**
 * Main controller to send messages to one or multiple recipients.
 * Supports "sms", "whatsapp", and "both" channels.
 */
export default async function sendMessage(requestBody = {}) {
  const { channel = "sms", message, contacts = [] } = requestBody;

  try {
    const selectedChannel = (channel || "sms").toLowerCase().trim();

    if (selectedChannel === "whatsapp") {
      return await sendBulkWhatsApp({ message, contacts });
    }

    if (selectedChannel === "both") {
      const [smsResult, whatsappResult] = await Promise.all([
        sendBulkSms({ message, contacts }),
        sendBulkWhatsApp({ message, contacts }),
      ]);

      const overallStatus = Boolean(smsResult?.status || whatsappResult?.status);

      return {
        status: overallStatus,
        channel: "both",
        message: `SMS: ${smsResult?.message || "N/A"} | WhatsApp: ${whatsappResult?.message || "N/A"}`,
        data: {
          sms: smsResult?.data,
          whatsapp: whatsappResult?.data,
          sentCount: (smsResult?.data?.sentCount || 0) + (whatsappResult?.data?.sentCount || 0),
          failedCount: (smsResult?.data?.failedCount || 0) + (whatsappResult?.data?.failedCount || 0),
          total: contacts.length,
        },
      };
    }

    // Default: SMS
    return await sendBulkSms(requestBody);
  } catch (error) {
    console.error("Error in messagerController:", error);
    return {
      status: false,
      message: error?.message || "Internal error occurred while processing message dispatch.",
    };
  }
}

export function addNewMsgTemplateController(request) {
  return new Promise((resolve, reject) => {
    const response = {
      status: false,
    };

    addNewMessageTemplateModel(request.body)
      .then((result) => {
        if (result.status) {
          resolve(result);
        } else {
          response.message = result.message;
          resolve(response);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function getUserMessageTemplates(userId) {
  return new Promise((resolve, reject) => {
    const response = {
      status: false,
    };

    getUserMessageTemplatesModel(userId)
      .then((result) => {
        if (result.status) {
          resolve(result);
        } else {
          response.message = result.message;
          resolve(response);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function deleteMessageTemplates(request) {
  return new Promise((resolve, reject) => {
    const response = {
      status: false,
    };
    const userId = request.body.id;
    const msgId = request.body.msgId;

    deleteMessageTemplateModel(userId, msgId)
      .then((result) => {
        if (result.status) {
          resolve(result);
        } else {
          response.message = result.message;
          resolve(response);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}
