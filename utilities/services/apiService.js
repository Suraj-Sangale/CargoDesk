import { apiList } from "@/utilities/apiList";
import getConfig from "next/config";

const { publicRuntimeConfig } = getConfig();

let isRedirectingUnauthorized = false;

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
export async function uploadMediaFile({ uploadUrl, file, mimeType, s3Key }) {
  // If image is larger than 500 KB, compress it before network transmission
  let uploadFile = file;
  let uploadMime = mimeType;
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
    const proxyEndpoint = apiList.PROXY_MAINTENANCE_UPLOAD || "/api/maintenance/uploads/proxy";
    const proxyUrl = `${proxyEndpoint}?s3Key=${encodeURIComponent(s3Key)}&mimeType=${encodeURIComponent(uploadMime)}`;
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
