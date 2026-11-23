import {
  addNewFleetModel,
  deleteFleetModel,
  getAllFleetsModel,
  getFleetByIdModel,
  updateFleetModel,
} from "../models/fleetModel";
import { getAuthUserFromReq } from "@/utilities/authServer";
import { generateFleetPresignedUploadUrl } from "../services/s3Service";

export function getAllFleetsController(requestOrUser = {}, authUser = null) {
  return new Promise((resolve, reject) => {
    getAllFleetsModel(requestOrUser, authUser)
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function getFleetByIdController(id, authUser = null) {
  return new Promise((resolve, reject) => {
    getFleetByIdModel(id, authUser)
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function addNewFleetController(request, authUser = null) {
  return new Promise((resolve, reject) => {
    addNewFleetModel(request, authUser)
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function updateFleetController(request, authUser = null) {
  return new Promise((resolve, reject) => {
    const id = request.id;
    updateFleetModel(id, request, authUser)
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function deleteFleetController(ids, authUser = null) {
  return new Promise((resolve, reject) => {
    deleteFleetModel(ids, authUser)
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export async function presignFleetUploadsController(req) {
  const authUser = getAuthUserFromReq(req);
  if (!authUser) {
    return { status: false, code: 401, message: "Unauthorized. Please log in." };
  }

  const { fleetId, files } = req.body || {};

  if (!Array.isArray(files) || files.length === 0) {
    return { status: false, code: 400, message: "Files array is required." };
  }

  if (files.length > 20) {
    return {
      status: false,
      code: 400,
      message: "Maximum 20 files can be uploaded per batch.",
    };
  }

  const presignedList = [];
  for (const f of files) {
    try {
      const presigned = await generateFleetPresignedUploadUrl({
        fleetId: fleetId || null,
        fileName: f.fileName,
        mimeType: f.mimeType,
        fileSize: f.fileSize,
        category: f.category || "photo",
      });

      presignedList.push({
        fileName: f.fileName,
        s3Key: presigned.s3Key,
        uploadUrl: presigned.uploadUrl,
        fileUrl: presigned.fileUrl,
        requiredHeaders: presigned.requiredHeaders,
        mediaType: presigned.mediaType,
        expiresIn: presigned.expiresIn,
      });
    } catch (err) {
      return {
        status: false,
        code: 400,
        message: err.message || `Validation failed for file ${f.fileName}`,
      };
    }
  }

  return {
    status: true,
    code: 200,
    data: presignedList,
    message: "Fleet upload URLs initialized successfully.",
  };
}
