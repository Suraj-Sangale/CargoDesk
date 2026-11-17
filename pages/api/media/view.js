import { generateSignedGetUrl, extractS3Key } from "@/backend/services/s3Service";

/**
 * Universal media viewer/streamer for S3 objects.
 * Solves private S3 bucket 403 Forbidden issues by dynamically
 * generating an authorized signed GET URL and redirecting the browser (HTTP 307).
 *
 * Query parameters:
 * - key: S3 object key (e.g., drivers/12/profile/abc.jpg)
 * - url: Full S3 URL (e.g., https://bucket.s3.region.amazonaws.com/drivers/...)
 * - download: If '1' or 'true', instructs browser to trigger download
 */
export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", ["GET", "HEAD"]);
    return res.status(405).json({ status: false, message: `Method ${req.method} Not Allowed` });
  }

  const { key, url } = req.query || {};
  const rawInput = key || url;

  if (!rawInput || typeof rawInput !== "string") {
    return res.status(400).json({ status: false, message: "Invalid or missing storage key." });
  }

  const s3Key = extractS3Key(rawInput);

  if (!s3Key || s3Key.includes("..")) {
    return res.status(400).json({ status: false, message: "Invalid or missing storage key." });
  }

  // Security check: Only allow authorized prefixes
  const isAllowedPrefix =
    s3Key.startsWith("drivers/") ||
    s3Key.startsWith("fleet/") ||
    s3Key.startsWith("documents/") ||
    s3Key.startsWith("uploads/");

  if (!isAllowedPrefix) {
    console.warn("Unauthorized storage path requested:", s3Key, "Raw input was:", rawInput);
    return res.status(403).json({ status: false, message: "Unauthorized storage path." });
  }

  // 1. Direct CDN / Custom Domain Bypass:
  // If a public CDN (CloudFront / Cloudflare CDN / custom domain) is configured,
  // permanently redirect (HTTP 308) to the edge domain with immutable caching.
  const customDomain = process.env.NEXT_PUBLIC_S3_CUSTOM_DOMAIN || process.env.S3_PUBLIC_DOMAIN;
  if (customDomain && customDomain.trim() !== "") {
    const cleanDomain = customDomain.trim().replace(/\/+$/, "");
    res.setHeader(
      "Cache-Control",
      "public, max-age=604800, s-maxage=2592000, stale-while-revalidate=2592000"
    );
    res.setHeader("CDN-Cache-Control", "public, max-age=2592000");
    return res.redirect(308, `${cleanDomain}/${s3Key}`);
  }

  try {
    // Generate fresh signed GET URL valid for 2 hours (7200 seconds)
    const signedUrl = await generateSignedGetUrl(s3Key, 7200);

    // Browser and Edge CDN cache control:
    // Browser caches for 24 hours; CDN edge (Cloudflare/CloudFront/Vercel) caches for 7 days.
    // Stale-while-revalidate serves instantly while renewing in the background.
    res.setHeader(
      "Cache-Control",
      "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000"
    );
    res.setHeader("CDN-Cache-Control", "public, max-age=604800");

    // Redirect browser to authorized S3 URL
    return res.redirect(307, signedUrl);
  } catch (error) {
    console.error("Error generating media view URL for key:", s3Key, error);
    return res.status(500).json({
      status: false,
      message: error.message || "Failed to load media file.",
    });
  }
}
