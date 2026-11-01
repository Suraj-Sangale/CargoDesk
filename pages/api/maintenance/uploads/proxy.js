import { getAuthUserFromReq } from "@/utilities/authServer";
import {
  uploadObjectDirect,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
} from "@/backend/services/s3Service";

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "PUT") {
    res.setHeader("Allow", ["POST", "PUT"]);
    return res.status(405).json({ status: false, message: `Method ${req.method} Not Allowed` });
  }

  const authUser = getAuthUserFromReq(req);
  if (!authUser) {
    return res.status(401).json({ status: false, message: "Unauthorized. Please log in." });
  }

  const { s3Key, mimeType } = req.query || {};

  if (!s3Key || typeof s3Key !== "string" || !s3Key.startsWith("fleet/maintenance/") || s3Key.includes("..")) {
    return res.status(400).json({ status: false, message: "Invalid or unauthorized S3 key." });
  }

  const normalizedMime = (mimeType || "").toLowerCase().trim();
  const isImage = ALLOWED_IMAGE_TYPES.has(normalizedMime);
  const isVideo = ALLOWED_VIDEO_TYPES.has(normalizedMime);

  if (!isImage && !isVideo) {
    return res.status(400).json({ status: false, message: `Unsupported file format: ${mimeType}` });
  }

  const maxAllowed = isVideo ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;

  try {
    const chunks = [];
    let receivedBytes = 0;

    for await (const chunk of req) {
      receivedBytes += chunk.length;
      if (receivedBytes > maxAllowed) {
        return res.status(413).json({
          status: false,
          message: `File exceeds maximum allowed size (${(maxAllowed / (1024 * 1024)).toFixed(0)} MB).`,
        });
      }
      chunks.push(chunk);
    }

    if (receivedBytes === 0) {
      return res.status(400).json({ status: false, message: "Uploaded file is empty." });
    }

    const buffer = Buffer.concat(chunks);
    await uploadObjectDirect({ s3Key, buffer, mimeType: normalizedMime });

    return res.status(200).json({
      status: true,
      message: "File uploaded successfully via secure server channel.",
      s3Key,
    });
  } catch (error) {
    console.error("Direct S3 upload error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Failed to upload file to storage.",
    });
  }
}

