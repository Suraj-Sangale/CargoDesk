import {
  addNewMessageTemplateModel,
  deleteMessageTemplateModel,
  getUserMessageTemplatesModel,
} from "../models/messangerModel";
import { sendBulkSms } from "../services/smsService";

/**
 * Main controller to send messages to one or multiple recipients.
 * Delegates to the unified SMS service (supporting Twilio, Fast2SMS, etc.)
 */
export default async function sendMessage(requestBody = {}) {
  try {
    return await sendBulkSms(requestBody);
  } catch (error) {
    console.error("Error in messagerController:", error);
    return {
      status: false,
      message: error?.message || "Internal error occurred while processing message dispatch.",
    };
  }
}

// postSiteApiData("SEND_SMS", request)
//   .then((result) => {
//     if (result.status) {
//       response.status = true;
//       response.message = "Message sent successfully";
//     } else {
//       response.message = result.message || "Failed to send message.";
//     }
//     resolve(response);
//   })
//   .catch((error) => {
//     response.message =
//       error.message || "An error occurred while sending the message.";
//     reject(response);
//   });

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
