import {
  addNewDriverModel,
  deleteDriverModel,
  getAllDriversModel,
  updateDriverModel,
} from "../models/driverModel";
import { getAuthUserFromReq } from "@/utilities/authServer";
import { generateDriverPresignedUploadUrl } from "../services/s3Service";

export function getAllDriversController(requestOrUser = {}, authUser = null) {
  return new Promise((resolve, reject) => {
    getAllDriversModel(requestOrUser, authUser)
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function addNewDriverController(request, authUser = null) {
  return new Promise((resolve, reject) => {
    addNewDriverModel(request, authUser)
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function updateDriverController(request, authUser = null) {
  return new Promise((resolve, reject) => {
    const id = request.id;
    updateDriverModel(id, request, authUser)
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function deleteDriverController(ids, authUser = null) {
  return new Promise((resolve, reject) => {
    deleteDriverModel(ids, authUser)
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

/**
 * Controller to handle presigned S3 upload URLs for a driver's photo and documents.
 */
export async function presignDriverUploadsController(req) {
  const authUser = getAuthUserFromReq(req);
  if (!authUser) {
    return { status: false, code: 401, message: "Unauthorized. Please log in." };
  }

  const { driverId, files } = req.body || {};

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
      const presigned = await generateDriverPresignedUploadUrl({
        driverId: driverId || null,
        fileName: f.fileName,
        mimeType: f.mimeType,
        fileSize: f.fileSize,
        category: f.category || "documents",
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
    message: "Driver upload URLs initialized successfully.",
  };
}
