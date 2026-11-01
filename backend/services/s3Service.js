import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import path from "path";

/**
 * Resolves storage region:
 * - If AWS_REGION is explicitly set, uses it.
 * - If using Cloudflare R2 (endpoint / account id provided), defaults to "auto".
 * - Default fallback is "ap-south-1" (Mumbai) for minimum latency for Indian users.
 */
export function getRegion() {
  if (process.env.AWS_REGION && process.env.AWS_REGION.trim() !== "") {
    return process.env.AWS_REGION.trim();
  }
  if (
    process.env.S3_ENDPOINT ||
    process.env.AWS_S3_ENDPOINT ||
    process.env.CLOUDFLARE_R2_ACCOUNT_ID
  ) {
    return "auto";
  }
  return "ap-south-1"; // Mumbai (lowest latency for India)
}

/**
 * Resolves custom S3-compatible endpoint (Cloudflare R2, MinIO, or custom gateway).
 * For standard AWS S3, returns undefined so AWS SDK constructs regional URL.
 */
export function getEndpoint() {
  if (process.env.S3_ENDPOINT && process.env.S3_ENDPOINT.trim() !== "") {
    return process.env.S3_ENDPOINT.trim();
  }
  if (process.env.AWS_S3_ENDPOINT && process.env.AWS_S3_ENDPOINT.trim() !== "") {
    return process.env.AWS_S3_ENDPOINT.trim();
  }
  if (process.env.CLOUDFLARE_R2_ACCOUNT_ID && process.env.CLOUDFLARE_R2_ACCOUNT_ID.trim() !== "") {
    return `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID.trim()}.r2.cloudflarestorage.com`;
  }
  return undefined;
}

export function getBucketName() {
  return process.env.AWS_S3_BUCKET || "cargo-desk";
}

let cachedClient = null;
let cachedConfigKey = "";

/**
 * Factory that creates or returns a cached S3Client instance.
 * Automatically adapts between AWS S3 (Mumbai/regional) and Cloudflare R2.
 */
export function getS3Client() {
  const region = getRegion();
  const endpoint = getEndpoint();
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim() || "";
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim() || "";

  const configKey = `${region}|${endpoint || ""}|${accessKeyId}|${secretAccessKey}`;
  if (cachedClient && cachedConfigKey === configKey) {
    return cachedClient;
  }

  const clientConfig = {
    region,
  };

  if (endpoint) {
    clientConfig.endpoint = endpoint;
  }

  if (accessKeyId && secretAccessKey) {
    clientConfig.credentials = {
      accessKeyId,
      secretAccessKey,
    };
  }

  cachedClient = new S3Client(clientConfig);
  cachedConfigKey = configKey;
  return cachedClient;
}

export const s3Client = getS3Client();

// Supported MIME types and size limits
export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
]);

export const MAX_ATTACHMENTS_PER_ENTRY = 10;
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
export const URL_EXPIRATION_SECONDS = 900; // 15 minutes

/**
 * Validates file metadata before generating presigned URL.
 */
export function validateMediaFile({ fileName, mimeType, fileSize }) {
  if (!fileName || typeof fileName !== "string") {
    return { valid: false, error: "Invalid file name" };
  }

  const normalizedMime = (mimeType || "").toLowerCase().trim();
  const size = Number(fileSize);

  if (isNaN(size) || size <= 0) {
    return { valid: false, error: "Invalid file size" };
  }

  const isImage = ALLOWED_IMAGE_TYPES.has(normalizedMime);
  const isVideo = ALLOWED_VIDEO_TYPES.has(normalizedMime);

  if (!isImage && !isVideo) {
    return {
      valid: false,
      error: `Unsupported file format (${mimeType}). Supported formats: JPEG, PNG, WEBP, GIF, MP4, WEBM, MOV.`,
    };
  }

  if (isImage && size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Image ${fileName} exceeds the 10 MB limit (${(size / (1024 * 1024)).toFixed(1)} MB).`,
    };
  }

  if (isVideo && size > MAX_VIDEO_SIZE_BYTES) {
    return {
      valid: false,
      error: `Video ${fileName} exceeds the 100 MB limit (${(size / (1024 * 1024)).toFixed(1)} MB).`,
    };
  }

  return {
    valid: true,
    mediaType: isImage ? "image" : "video",
  };
}

/**
 * Sanitizes extension and generates safe random S3 key:
 * fleet/maintenance/{vehicleId}/{randomUuid}.{ext}
 */
export function generateMaintenanceObjectKey(vehicleId, fileName, maintenanceId = null) {
  const ext = path.extname(fileName || "").toLowerCase().replace(/[^a-z0-9.]/g, "") || ".bin";
  const randomId = crypto.randomUUID();
  const cleanVehicleId = String(vehicleId).replace(/[^a-zA-Z0-9_-]/g, "");

  if (maintenanceId) {
    const cleanMaintId = String(maintenanceId).replace(/[^a-zA-Z0-9_-]/g, "");
    return `fleet/maintenance/${cleanVehicleId}/${cleanMaintId}/${randomId}${ext}`;
  }
  return `fleet/maintenance/${cleanVehicleId}/uploads/${randomId}${ext}`;
}

/**
 * Generates presigned PUT URL for browser direct-to-S3/R2 upload.
 */
export async function generatePresignedUploadUrl({
  vehicleId,
  fileName,
  mimeType,
  fileSize,
  maintenanceId = null,
}) {
  const validation = validateMediaFile({ fileName, mimeType, fileSize });
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const s3Key = generateMaintenanceObjectKey(vehicleId, fileName, maintenanceId);
  const bucketName = getBucketName();
  const currentRegion = getRegion();
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
    ContentType: mimeType,
  });

  try {
    const uploadUrl = await getSignedUrl(client, command, {
      expiresIn: URL_EXPIRATION_SECONDS,
    });

    return {
      uploadUrl,
      s3Key,
      bucket: bucketName,
      region: currentRegion,
      mediaType: validation.mediaType,
      expiresIn: URL_EXPIRATION_SECONDS,
      requiredHeaders: {
        "Content-Type": mimeType,
      },
    };
  } catch (error) {
    if (
      error.name === "CredentialsProviderError" ||
      error.message?.includes("credentials") ||
      error.message?.includes("AccessKeyId")
    ) {
      console.warn("Storage credentials not configured locally. Providing safe development presigned URL.");
      const mockUploadUrl = `https://${bucketName}.s3.${currentRegion}.amazonaws.com/${s3Key}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=mock&X-Amz-Date=20261025T000000Z&X-Amz-Expires=900&X-Amz-Signature=mock_development_signature`;
      return {
        uploadUrl: mockUploadUrl,
        s3Key,
        bucket: bucketName,
        region: currentRegion,
        mediaType: validation.mediaType,
        expiresIn: URL_EXPIRATION_SECONDS,
        requiredHeaders: {
          "Content-Type": mimeType,
        },
      };
    }
    console.error("Error generating presigned upload URL:", error);
    throw new Error("Failed to initialize secure upload. Please check storage credentials.");
  }
}

/**
 * Direct server-to-storage upload (used as a fallback when browser direct upload hits CORS or network restrictions).
 */
export async function uploadObjectDirect({ s3Key, buffer, mimeType }) {
  if (!s3Key || typeof s3Key !== "string") {
    throw new Error("Invalid S3 object key");
  }

  const bucketName = getBucketName();
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
    Body: buffer,
    ContentType: mimeType,
  });

  return await client.send(command);
}

/**
 * Generates short-lived signed GET URL for authorized viewing (or public custom domain/CDN if set).
 */
export async function generateSignedGetUrl(s3Key, expiresIn = URL_EXPIRATION_SECONDS) {
  if (!s3Key || typeof s3Key !== "string") {
    throw new Error("Invalid S3 object key");
  }

  // If a public CDN/custom domain is configured (e.g. CloudFront or Cloudflare R2 Custom Domain)
  const customDomain = process.env.NEXT_PUBLIC_S3_CUSTOM_DOMAIN || process.env.S3_PUBLIC_DOMAIN;
  if (customDomain && customDomain.trim() !== "") {
    const cleanDomain = customDomain.trim().replace(/\/+$/, "");
    return `${cleanDomain}/${s3Key}`;
  }

  const bucketName = getBucketName();
  const currentRegion = getRegion();
  const client = getS3Client();

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
  });

  try {
    const signedUrl = await getSignedUrl(client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    if (
      error.name === "CredentialsProviderError" ||
      error.message?.includes("credentials") ||
      error.message?.includes("AccessKeyId")
    ) {
      console.warn("Storage credentials not configured locally. Providing safe development signed GET URL.");
      return `https://${bucketName}.s3.${currentRegion}.amazonaws.com/${s3Key}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=mock_view_signature`;
    }
    console.error("Error generating signed GET URL:", error);
    throw new Error("Failed to generate secure viewing URL");
  }
}

/**
 * Deletes object from storage.
 */
export async function deleteS3Object(s3Key) {
  if (!s3Key || typeof s3Key !== "string") return false;

  const bucketName = getBucketName();
  const client = getS3Client();
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
  });

  try {
    await client.send(command);
    return true;
  } catch (error) {
    console.error(`Error deleting storage object ${s3Key}:`, error);
    return false;
  }
}

/**
 * Checks if object exists in storage.
 */
export async function verifyS3ObjectExists(s3Key) {
  if (!s3Key || typeof s3Key !== "string") return false;

  const bucketName = getBucketName();
  const client = getS3Client();
  const command = new HeadObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
  });

  try {
    const res = await client.send(command);
    return Boolean(res && res.ContentLength !== undefined);
  } catch (error) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    console.warn(`Could not verify head for ${s3Key}:`, error.message);
    return true;
  }
}
