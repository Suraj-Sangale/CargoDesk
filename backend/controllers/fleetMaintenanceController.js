import {
  createMaintenanceRecordModel,
  getMaintenanceListByVehicleModel,
  getMaintenanceByIdModel,
  updateMaintenanceRecordModel,
  deleteMaintenanceMediaModel,
  deleteMaintenanceRecordModel,
} from "../models/fleetMaintenanceModel";
import {
  generatePresignedUploadUrl,
  generateSignedGetUrl,
  deleteS3Object,
  MAX_ATTACHMENTS_PER_ENTRY,
} from "../services/s3Service";
import { getAuthUserFromReq } from "@/utilities/authServer";
import executeQuery from "@/helpers/dbConnection";

/**
 * Controller to handle presigned S3 upload URLs for a vehicle's maintenance attachments.
 */
export async function presignMaintenanceUploadsController(req) {
  const authUser = getAuthUserFromReq(req);
  if (!authUser) {
    return { status: false, code: 401, message: "Unauthorized. Please log in." };
  }

  const { vehicleId, files } = req.body || {};
  const vid = Number(vehicleId);

  if (!vid || isNaN(vid)) {
    return { status: false, code: 400, message: "Valid vehicle ID is required." };
  }

  // Verify vehicle exists
  const vehicle = await executeQuery("SELECT id FROM fleets WHERE id = ? LIMIT 1", [vid]);
  if (!Array.isArray(vehicle) || vehicle.length === 0) {
    return { status: false, code: 404, message: "Vehicle not found." };
  }

  if (!Array.isArray(files) || files.length === 0) {
    return { status: false, code: 400, message: "Files array is required." };
  }

  if (files.length > MAX_ATTACHMENTS_PER_ENTRY) {
    return {
      status: false,
      code: 400,
      message: `Maximum ${MAX_ATTACHMENTS_PER_ENTRY} files can be uploaded per maintenance entry.`,
    };
  }

  const presignedList = [];
  for (const f of files) {
    try {
      const presigned = await generatePresignedUploadUrl({
        vehicleId: vid,
        fileName: f.fileName,
        mimeType: f.mimeType,
        fileSize: f.fileSize,
      });

      presignedList.push({
        fileName: f.fileName,
        s3Key: presigned.s3Key,
        uploadUrl: presigned.uploadUrl,
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
    message: "Presigned upload URLs generated successfully.",
  };
}

/**
 * Controller to create a new maintenance record.
 */
export async function createMaintenanceController(req) {
  const authUser = getAuthUserFromReq(req);
  if (!authUser) {
    return { status: false, code: 401, message: "Unauthorized. Please log in." };
  }

  const body = req.body || {};
  const { vehicle_id, maintenance_type, description, maintenance_date } = body;

  if (!vehicle_id) {
    return { status: false, code: 400, message: "Vehicle selection is required." };
  }
  if (!maintenance_type || String(maintenance_type).trim() === "") {
    return { status: false, code: 400, message: "Maintenance type is required." };
  }
  if (!description || String(description).trim() === "") {
    return { status: false, code: 400, message: "Maintenance description is required." };
  }
  if (!maintenance_date) {
    return { status: false, code: 400, message: "Maintenance date is required." };
  }

  if (body.cost !== undefined && body.cost !== null && body.cost !== "") {
    const numCost = parseFloat(body.cost);
    if (isNaN(numCost) || numCost < 0) {
      return { status: false, code: 400, message: "Maintenance cost cannot be negative." };
    }
  }

  if (body.odometer_reading !== undefined && body.odometer_reading !== null && body.odometer_reading !== "") {
    const numOdo = parseInt(body.odometer_reading, 10);
    if (isNaN(numOdo) || numOdo < 0) {
      return { status: false, code: 400, message: "Odometer reading cannot be negative." };
    }
  }

  try {
    const record = await createMaintenanceRecordModel(body, authUser);
    return {
      status: true,
      code: 201,
      data: record,
      message: "Maintenance record saved successfully.",
    };
  } catch (error) {
    console.error("Error creating maintenance record:", error);
    return {
      status: false,
      code: error.message.includes("not exist") ? 404 : 500,
      message: error.message || "Failed to save maintenance record.",
    };
  }
}

/**
 * Controller to list maintenance history for a vehicle.
 */
export async function getMaintenanceListByVehicleController(vehicleId, query = {}, req = null) {
  const vid = Number(vehicleId);
  if (!vid || isNaN(vid)) {
    return { status: false, code: 400, message: "Invalid vehicle ID." };
  }

  try {
    const result = await getMaintenanceListByVehicleModel({
      vehicleId: vid,
      page: query.page,
      limit: query.limit,
      status: query.status,
      maintenanceType: query.maintenance_type,
      search: query.search,
    });

    return {
      status: true,
      code: 200,
      data: result.records,
      summary: result.summary,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
      message: "Maintenance records retrieved successfully.",
    };
  } catch (error) {
    console.error("Error retrieving vehicle maintenance list:", error);
    return {
      status: false,
      code: 500,
      message: error.message || "Failed to retrieve maintenance history.",
    };
  }
}

/**
 * Controller to get a single maintenance record with its media items.
 */
export async function getMaintenanceByIdController(id) {
  const mid = Number(id);
  if (!mid || isNaN(mid)) {
    return { status: false, code: 400, message: "Invalid maintenance ID." };
  }

  try {
    const record = await getMaintenanceByIdModel(mid);
    if (!record) {
      return { status: false, code: 404, message: "Maintenance record not found." };
    }

    // Attach signed viewing URLs to media items so client components can preview immediately
    if (Array.isArray(record.media) && record.media.length > 0) {
      await Promise.all(
        record.media.map(async (m) => {
          try {
            m.signedUrl = await generateSignedGetUrl(m.s3_key);
          } catch (urlErr) {
            console.warn(`Could not sign url for ${m.s3_key}:`, urlErr?.message);
          }
        })
      );
    }

    return {
      status: true,
      code: 200,
      data: record,
      message: "Maintenance record fetched successfully.",
    };
  } catch (error) {
    console.error("Error fetching maintenance record:", error);
    return {
      status: false,
      code: 500,
      message: error.message || "Failed to fetch maintenance details.",
    };
  }
}

/**
 * Controller to update an existing maintenance record.
 */
export async function updateMaintenanceController(id, req) {
  const authUser = getAuthUserFromReq(req);
  if (!authUser) {
    return { status: false, code: 401, message: "Unauthorized. Please log in." };
  }

  const mid = Number(id);
  if (!mid || isNaN(mid)) {
    return { status: false, code: 400, message: "Invalid maintenance ID." };
  }

  const body = req.body || {};

  if (body.cost !== undefined && body.cost !== null && body.cost !== "") {
    const numCost = parseFloat(body.cost);
    if (isNaN(numCost) || numCost < 0) {
      return { status: false, code: 400, message: "Maintenance cost cannot be negative." };
    }
  }

  if (body.odometer_reading !== undefined && body.odometer_reading !== null && body.odometer_reading !== "") {
    const numOdo = parseInt(body.odometer_reading, 10);
    if (isNaN(numOdo) || numOdo < 0) {
      return { status: false, code: 400, message: "Odometer reading cannot be negative." };
    }
  }

  try {
    const updated = await updateMaintenanceRecordModel(mid, body, authUser);
    return {
      status: true,
      code: 200,
      data: updated,
      message: "Maintenance record updated successfully.",
    };
  } catch (error) {
    console.error("Error updating maintenance record:", error);
    return {
      status: false,
      code: error.message.includes("not found") ? 404 : 500,
      message: error.message || "Failed to update maintenance record.",
    };
  }
}

/**
 * Controller to generate a short-lived signed GET URL for authorized media viewing.
 */
export async function getMediaSignedUrlController(maintenanceId, mediaId, req) {
  const authUser = getAuthUserFromReq(req);
  if (!authUser) {
    return { status: false, code: 401, message: "Unauthorized. Please log in." };
  }

  const mid = Number(maintenanceId);
  const mItemId = Number(mediaId);

  if (!mid || !mItemId) {
    return { status: false, code: 400, message: "Invalid maintenance or media ID." };
  }

  try {
    const rows = await executeQuery(
      "SELECT id, s3_key, file_name, mime_type FROM fleet_maintenance_media WHERE id = ? AND maintenance_id = ? LIMIT 1",
      [mItemId, mid]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return { status: false, code: 404, message: "Media attachment not found." };
    }

    const item = rows[0];
    const signedUrl = await generateSignedGetUrl(item.s3_key);

    return {
      status: true,
      code: 200,
      data: {
        id: item.id,
        fileName: item.file_name,
        mimeType: item.mime_type,
        signedUrl,
      },
      message: "Signed viewing URL generated successfully.",
    };
  } catch (error) {
    console.error("Error generating media viewing URL:", error);
    return {
      status: false,
      code: 500,
      message: error.message || "Failed to generate media URL.",
    };
  }
}

/**
 * Controller to delete a specific media attachment from DB and S3.
 */
export async function deleteMaintenanceMediaController(maintenanceId, mediaId, req) {
  const authUser = getAuthUserFromReq(req);
  if (!authUser) {
    return { status: false, code: 401, message: "Unauthorized. Please log in." };
  }

  const mid = Number(maintenanceId);
  const mItemId = Number(mediaId);

  if (!mid || !mItemId) {
    return { status: false, code: 400, message: "Invalid maintenance or media ID." };
  }

  try {
    const deletedMedia = await deleteMaintenanceMediaModel(mid, mItemId);
    if (!deletedMedia) {
      return { status: false, code: 404, message: "Attachment not found." };
    }

    // Delete from S3 in background/cleanup
    if (deletedMedia.s3_key) {
      deleteS3Object(deletedMedia.s3_key).catch((err) =>
        console.warn(`Failed S3 cleanup for key ${deletedMedia.s3_key}:`, err.message)
      );
    }

    return {
      status: true,
      code: 200,
      message: "Media attachment deleted successfully.",
    };
  } catch (error) {
    console.error("Error deleting maintenance media:", error);
    return {
      status: false,
      code: 500,
      message: error.message || "Failed to delete attachment.",
    };
  }
}

/**
 * Controller to delete a maintenance record and all its associated S3 files.
 */
export async function deleteMaintenanceRecordController(id, req) {
  const authUser = getAuthUserFromReq(req);
  if (!authUser) {
    return { status: false, code: 401, message: "Unauthorized. Please log in." };
  }

  const mid = Number(id);
  if (!mid || isNaN(mid)) {
    return { status: false, code: 400, message: "Invalid maintenance ID." };
  }

  try {
    const result = await deleteMaintenanceRecordModel(mid, authUser);
    if (!result || !result.deleted) {
      return { status: false, code: 404, message: "Maintenance record not found." };
    }

    // Clean up S3 objects
    if (Array.isArray(result.s3Keys) && result.s3Keys.length > 0) {
      Promise.all(result.s3Keys.map((k) => deleteS3Object(k))).catch((err) =>
        console.warn("Failed S3 cleanup after maintenance deletion:", err.message)
      );
    }

    return {
      status: true,
      code: 200,
      message: "Maintenance record and attachments deleted successfully.",
    };
  } catch (error) {
    console.error("Error deleting maintenance record:", error);
    return {
      status: false,
      code: 500,
      message: error.message || "Failed to delete maintenance record.",
    };
  }
}
