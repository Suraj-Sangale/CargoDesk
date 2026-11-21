import { apiList } from "@/utilities/apiList";
import getConfig from "next/config";

const nextConfig = getConfig();
const publicRuntimeConfig = nextConfig?.publicRuntimeConfig || {};

let isRedirectingUnauthorized = false;

// Client-side in-memory SWR cache store: Map<cacheKey, { data, timestamp, inFlightPromise }>
const clientApiCache = new Map();
const cacheSubscribers = new Map(); // key -> Set<callback>

// Mutation mapping to target query invalidations
const MUTATION_INVALIDATION_RULES = {
  // Drivers
  ADD_NEW_DRIVER: ["GET_ALL_DRIVERS", "GET_AVAILABLE_DRIVERS"],
  UPDATE_DRIVER: ["GET_ALL_DRIVERS", "GET_AVAILABLE_DRIVERS"],
  DELETE_DRIVERS: ["GET_ALL_DRIVERS", "GET_AVAILABLE_DRIVERS"],
  DELETE_DRIVER_DOCUMENT: ["GET_ALL_DRIVERS"],

  // Fleets
  ADD_NEW_FLEET: ["GET_ALL_FLEETS", "GET_VEHICLES_LIST", "GET_AVAILABLE_FLEETS"],
  UPDATE_FLEET: ["GET_ALL_FLEETS", "GET_VEHICLES_LIST", "GET_AVAILABLE_FLEETS", "GET_FLEET_BY_ID"],
  DELETE_FLEETS: ["GET_ALL_FLEETS", "GET_VEHICLES_LIST", "GET_AVAILABLE_FLEETS"],

  // Fleet-Driver Assignment
  ASSIGN_FLEET_DRIVER: ["GET_ALL_FLEETS", "GET_ALL_DRIVERS", "GET_VEHICLES_LIST"],
  REMOVE_FLEET_DRIVER: ["GET_ALL_FLEETS", "GET_ALL_DRIVERS", "GET_VEHICLES_LIST"],

  // Maintenance & History
  ADD_NEW_MAINTENANCE: ["GET_VEHICLE_MAINTENANCE", "GET_FLEET_HISTORY", "GET_VEHICLES_LIST"],
  CREATE_MAINTENANCE_RECORD: ["GET_VEHICLE_MAINTENANCE", "GET_FLEET_HISTORY", "GET_VEHICLES_LIST"],
  UPDATE_MAINTENANCE_RECORD: ["GET_VEHICLE_MAINTENANCE", "GET_FLEET_HISTORY"],
  DELETE_MAINTENANCE_RECORD: ["GET_VEHICLE_MAINTENANCE", "GET_FLEET_HISTORY"],
  DELETE_MAINTENANCE_MEDIA: ["GET_VEHICLE_MAINTENANCE", "GET_MAINTENANCE_RECORD"],
  LOG_FLEET_ACTIVITY: ["GET_FLEET_HISTORY", "GET_ALL_FLEETS"],
};

export function getCacheKey(action, payload = {}) {
  try {
    return `${action}:${JSON.stringify(payload || {})}`;
  } catch (_) {
    return `${action}`;
  }
}

/**
 * Invalidate client-side API cache by action name, substring pattern, or clear all.
 */
export function invalidateApiCache(targetPattern = null) {
  if (!targetPattern) {
    clientApiCache.clear();
    return;
  }
  const needle = String(targetPattern).toUpperCase();
  for (const key of clientApiCache.keys()) {
    if (key.toUpperCase().includes(needle)) {
      clientApiCache.delete(key);
    }
  }
}

/**
 * Subscribe to cache updates for a given cache key.
 */
export function subscribeApiCache(cacheKey, callback) {
  if (!cacheSubscribers.has(cacheKey)) {
    cacheSubscribers.set(cacheKey, new Set());
  }
  cacheSubscribers.get(cacheKey).add(callback);
  return () => {
    const set = cacheSubscribers.get(cacheKey);
    if (set) {
      set.delete(callback);
      if (set.size === 0) cacheSubscribers.delete(cacheKey);
    }
  };
}

function notifyCacheSubscribers(cacheKey, freshData) {
  const subscribers = cacheSubscribers.get(cacheKey);
  if (subscribers) {
    for (const cb of subscribers) {
      try {
        cb(freshData);
      } catch (err) {
        console.error("Error in cache subscriber:", err);
      }
    }
  }
}

// Window focus & tab visibility listener for silent stale cache revalidation
if (typeof window !== "undefined") {
  const handleFocusRevalidate = () => {
    const now = Date.now();
    for (const [key, entry] of clientApiCache.entries()) {
      // If entry has active subscribers and is older than 45 seconds, revalidate quietly
      if (entry?.data && cacheSubscribers.has(key) && now - entry.timestamp > 45000) {
        const colonIdx = key.indexOf(":");
        const action = colonIdx > -1 ? key.slice(0, colonIdx) : key;
        const rawPayload = colonIdx > -1 ? key.slice(colonIdx + 1) : "{}";
        try {
          const payload = JSON.parse(rawPayload);
          swrPostApiData(action, payload, { force: true });
        } catch (_) {}
      }
    }
  };

  window.addEventListener("focus", handleFocusRevalidate, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      handleFocusRevalidate();
    }
  }, { passive: true });
}

function handleUnauthorizedClient() {
  if (typeof window === "undefined" || isRedirectingUnauthorized) return;

  const currentPathname = window.location.pathname;
  if (currentPathname === "/login" || currentPathname === "/sign-up") {
    return;
  }

  isRedirectingUnauthorized = true;
  const currentPath = window.location.pathname + window.location.search;
  const redirectQuery =
    currentPath && currentPath !== "/"
      ? `?redirect=${encodeURIComponent(currentPath)}`
      : "";

  window.location.href = `/login${redirectQuery}`;
}

const callFetchMethod = (
  apiEndpoint,
  payload = {},
  authToken = "",
  method = "POST",
  variables = {}
) => {
  return new Promise((resolve, reject) => {
    Object.keys(variables).forEach(function (key) {
      apiEndpoint = apiEndpoint.replace(key, variables[key], apiEndpoint);
    });

    const apiParams = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (method == "POST" || method == "PUT") {
      apiParams["body"] = JSON.stringify(payload);
    }

    fetch(apiEndpoint, apiParams)
      .then((response) => {
        resolve(response);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

// POST API call to NextJs API
export function postApiData(action, payload = {}) {
  return new Promise((resolve, reject) => {
    if (typeof apiList[action] != "undefined") {
      const apiCall = callFetchMethod(apiList[action], payload);

      apiCall
        .then(async (response) => {
          if (!response.ok) {
            // Handle 401 Unauthorized globally for authenticated API calls
            if (response.status === 401 && action !== "VERIFY_USER_LOGIN" && !action.startsWith("FORGOT_PASSWORD_")) {
              handleUnauthorizedClient();
              return resolve({
                status: false,
                message: "Session expired. Redirecting to login...",
              });
            }

            if (response.status === 413) {
              return resolve({
                status: false,
                message: "Payload too large. Please upload smaller documents or compress images.",
              });
            }

            try {
              const errJson = await response.json();
              return resolve(errJson);
            } catch (_) {
              return resolve({
                status: false,
                message: `Server returned error (${response.status})`,
              });
            }
          }
          try {
            const data = await response.json();
            if (data && data.status) {
              // Auto-invalidate read caches affected by this mutation
              const invalidations = MUTATION_INVALIDATION_RULES[action];
              if (invalidations && invalidations.length > 0) {
                invalidations.forEach((target) => invalidateApiCache(target));
              }
            }
            resolve(data);
          } catch (_) {
            resolve({
              status: false,
              message: "Invalid response from server (expected JSON).",
            });
          }
        })
        .catch((error) => {
          reject(error);
        });
    } else {
      resolve({
        status: false,
        message: `API action ${action} not found`,
      });
    }
  });
}

/**
 * Stale-While-Revalidate (SWR) Client API Caller:
 * - Instant in-memory cache return (0 ms UI delay)
 * - Background network revalidation when stale
 * - In-flight request deduplication
 * - Custom subscriber / callback notification
 *
 * @param {string} action - Action name from apiList
 * @param {object} payload - API payload
 * @param {object} options - SWR options { ttl: 60000, force: false, onRevalidate: fn }
 */
export async function swrPostApiData(action, payload = {}, options = {}) {
  const { ttl = 60000, force = false, onRevalidate = null } = options;
  const cacheKey = getCacheKey(action, payload);
  const now = Date.now();
  const cached = clientApiCache.get(cacheKey);

  const fetchFreshData = async () => {
    // Reuse in-flight promise to prevent duplicate concurrent network calls
    if (cached?.inFlightPromise) {
      return cached.inFlightPromise;
    }

    const inFlightPromise = postApiData(action, payload)
      .then((res) => {
        if (res && res.status) {
          const entry = {
            data: res,
            timestamp: Date.now(),
            inFlightPromise: null,
          };
          clientApiCache.set(cacheKey, entry);
          notifyCacheSubscribers(cacheKey, res);
          if (typeof onRevalidate === "function") {
            try {
              onRevalidate(res);
            } catch (err) {
              console.error("Error in onRevalidate:", err);
            }
          }
        } else {
          if (cached) cached.inFlightPromise = null;
        }
        return res;
      })
      .catch((err) => {
        if (cached) cached.inFlightPromise = null;
        throw err;
      });

    if (cached) {
      cached.inFlightPromise = inFlightPromise;
    } else {
      clientApiCache.set(cacheKey, {
        data: null,
        timestamp: 0,
        inFlightPromise,
      });
    }

    return inFlightPromise;
  };

  // 1. Force refresh requested (e.g. user manually refreshed, or right after mutation)
  if (force) {
    return await fetchFreshData();
  }

  // 2. Cache Hit: Return cached data instantly (0 ms)
  if (cached && cached.data) {
    const isStale = now - cached.timestamp > ttl;
    if (isStale) {
      // Trigger background revalidation quietly without blocking the caller
      fetchFreshData().catch((err) =>
        console.warn(`Background revalidation failed for ${action}:`, err)
      );
    }
    return cached.data;
  }

  // 3. Cache Miss or In-Flight: Await fresh data
  if (cached?.inFlightPromise) {
    return await cached.inFlightPromise;
  }

  return await fetchFreshData();
}

// POST API call to NodeJs API
export function postSiteApiData(
  action,
  payload,
  accessToken = "",
  variables = {}
) {
  return new Promise((resolve, reject) => {
    if (typeof apiList[action] != "undefined") {
      const apiCall = callFetchMethod(
        process.env.NODE_API_URL + apiList[action],
        payload,
        accessToken == "" ? process.env.NODE_API_URL : "Bearer " + accessToken,
        "POST",
        variables
      );

      apiCall
        .then(async (response) => {
          if (response.status === 401 && action !== "VERIFY_USER_LOGIN" && !action.startsWith("FORGOT_PASSWORD_")) {
            handleUnauthorizedClient();
          }
          if (response.status === 413) {
            return resolve({
              status: false,
              message: "Payload too large. Please compress or select smaller files.",
            });
          }
          try {
            const responseData = await response.json();
            resolve(responseData);
          } catch (_) {
            resolve({
              status: false,
              message: `Server returned non-JSON response (${response.status})`,
            });
          }
        })
        .catch((error) => {
          console.error("Site API error:", error);
          reject(error);
        });
    } else {
      resolve({
        status: false,
        message: `Site API action ${action} not found`,
      });
    }
  });
}

/**
 * Automatically compresses an image File or Blob on the client using HTML5 Canvas.
 * Downscales images exceeding maxDimension (e.g. 1920px) and compresses to high-quality JPEG.
 * This shrinks 5MB - 12MB camera photos down to 250KB - 500KB in ~50ms,
 * preventing HTTP 413 "Request Entity Too Large" errors and speeding up mobile uploads by 10x.
 *
 * @param {File} file - Raw image file from camera or file picker
 * @param {object} [options]
 * @param {number} [options.maxDimension=1920] - Max width or height in pixels
 * @param {number} [options.quality=0.82] - JPEG quality (0.0 to 1.0)
 * @returns {Promise<File>} Compressed File object
 */
export async function compressImageFile(file, options = {}) {
  if (
    !file ||
    typeof window === "undefined" ||
    !file.type ||
    !file.type.startsWith("image/") ||
    file.type === "image/svg+xml" ||
    file.type === "image/gif"
  ) {
    return file;
  }

  // If already under 500 KB, no need to re-compress
  if (file.size <= 500 * 1024) {
    return file;
  }

  const maxDimension = options.maxDimension || 1920;
  const quality = options.quality || 0.82;

  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onerror = () => resolve(file);
      reader.onload = (event) => {
        const img = new Image();
        img.onerror = () => resolve(file);
        img.onload = () => {
          try {
            let width = img.width;
            let height = img.height;

            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) return resolve(file);

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              (blob) => {
                if (!blob || blob.size >= file.size) {
                  return resolve(file);
                }

                const baseName = file.name.replace(/\.[^/.]+$/, "");
                const compressedFile = new File([blob], `${baseName}.jpg`, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              },
              "image/jpeg",
              quality
            );
          } catch (e) {
            console.warn("Canvas compression error, using original file:", e);
            resolve(file);
          }
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.warn("FileReader error, using original file:", e);
      resolve(file);
    }
  });
}

/**
 * Common storage upload service with automatic fallback:
 * 1. Attempts direct PUT upload to S3/R2 presigned URL.
 * 2. If blocked by browser CORS or network, automatically uploads via server proxy.
 *
 * @param {object} params
 * @param {string} params.uploadUrl - Presigned PUT URL
 * @param {File|Blob} params.file - Binary file object
 * @param {string} params.mimeType - File MIME type
 * @param {string} params.s3Key - Safe storage key for proxy fallback
 * @returns {Promise<{ status: boolean, mode: string }>}
 */
export async function uploadMediaFile({ uploadUrl, file, mimeType, s3Key, proxyEndpoint = null }) {
  // If image is larger than 500 KB, compress it before network transmission
  let uploadFile = file;
  let uploadMime = mimeType || file?.type || "application/octet-stream";
  if (file && file.type && file.type.startsWith("image/") && file.size > 500 * 1024) {
    try {
      uploadFile = await compressImageFile(file);
      uploadMime = uploadFile.type || mimeType;
    } catch (_) {}
  }

  // 1. Direct PUT upload to S3/R2 presigned URL
  if (uploadUrl) {
    try {
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": uploadMime,
        },
        body: uploadFile,
      });

      if (uploadRes.ok) {
        return { status: true, mode: "direct" };
      }
      console.warn(`Direct storage upload returned HTTP ${uploadRes.status}, trying server proxy fallback...`);
    } catch (directErr) {
      console.warn("Direct storage upload failed (likely CORS or network). Trying server proxy fallback...", directErr);
    }
  }

  // 2. Fallback: Upload via server proxy if direct upload was blocked
  if (s3Key) {
    const defaultProxy = s3Key.startsWith("drivers/")
      ? (apiList.PROXY_DRIVER_UPLOAD || "/api/driver/uploads/proxy")
      : (apiList.PROXY_MAINTENANCE_UPLOAD || "/api/maintenance/uploads/proxy");
    const targetProxy = proxyEndpoint || defaultProxy;
    const proxyUrl = `${targetProxy}?s3Key=${encodeURIComponent(s3Key)}&mimeType=${encodeURIComponent(uploadMime)}`;
    const proxyRes = await fetch(proxyUrl, {
      method: "POST",
      headers: {
        "Content-Type": uploadMime,
      },
      body: uploadFile,
    });

    let proxyJson = null;
    let proxyText = "";
    try {
      proxyJson = await proxyRes.json();
    } catch (_) {
      try {
        proxyText = await proxyRes.text();
      } catch (_) {}
    }

    if (proxyRes.ok && proxyJson?.status) {
      return { status: true, mode: "proxy", ...proxyJson };
    }

    if (proxyRes.status === 413) {
      throw new Error(
        "File is too large for upload. The file was automatically compressed, but still exceeded network limits. Please select a smaller photo."
      );
    }

    throw new Error(
      proxyJson?.message ||
        (proxyText && proxyText.length < 200 ? proxyText : null) ||
        `Upload failed with server status ${proxyRes.status}.`
    );
  }

  throw new Error("Missing upload configuration for media file.");
}

/**
 * Universal client/server URL resolver for stored media.
 * Automatically wraps private S3 keys and direct AWS S3 URLs into
 * the secure authorized /api/media/view endpoint so they never return 403 Forbidden.
 * Leaves blob:, data:, and relative URLs intact.
 */
export function resolveMediaUrl(urlOrKey) {
  if (!urlOrKey || typeof urlOrKey !== "string") return "";
  let raw = decodeURIComponent(urlOrKey).trim();
  if (raw.startsWith("data:") || raw.startsWith("blob:")) return raw;

  const customDomain =
    process.env.NEXT_PUBLIC_S3_CUSTOM_DOMAIN ||
    publicRuntimeConfig?.NEXT_PUBLIC_S3_CUSTOM_DOMAIN;
  const cdnBase = customDomain ? customDomain.trim().replace(/\/+$/, "") : "";

  // 1. If it's already a proxy view URL: e.g. /api/media/view?key=drivers/...
  if (raw.includes("/api/media/view") && raw.includes("key=")) {
    try {
      const parsed = new URL(raw, "http://localhost");
      const k = parsed.searchParams.get("key");
      if (k) {
        const cleanK = decodeURIComponent(k).trim().replace(/^\/+/, "");
        if (cdnBase) return `${cdnBase}/${cleanK}`;
        return `/api/media/view?key=${encodeURIComponent(cleanK)}`;
      }
    } catch (_) {}
    return raw;
  }

  // 2. If key contains a known prefix anywhere in path, match from that prefix
  const prefixMatch = raw.match(
    /(drivers\/[^\s?#]+|fleet\/[^\s?#]+|documents\/[^\s?#]+|uploads\/[^\s?#]+)/i
  );
  if (prefixMatch && prefixMatch[1]) {
    const cleanK = prefixMatch[1].replace(/^\/+/, "");
    if (cdnBase) return `${cdnBase}/${cleanK}`;
    return `/api/media/view?key=${encodeURIComponent(cleanK)}`;
  }

  // 3. If it's a full URL, parse path
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const urlObj = new URL(raw);
      const cleanPath = urlObj.pathname.replace(/^\/+/, "").split("?")[0];
      if (cleanPath) {
        if (cdnBase) return `${cdnBase}/${cleanPath}`;
        return `/api/media/view?key=${encodeURIComponent(cleanPath)}`;
      }
    } catch (_) {}
  }

  return raw;
}
