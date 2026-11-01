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
            if (response.status === 401 && action !== "VERIFY_USER_LOGIN") {
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
          resolve(response.json());
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
          if (response.status === 401 && action !== "VERIFY_USER_LOGIN") {
            handleUnauthorizedClient();
          }
          const responseData = await response.json();
          resolve(responseData);
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
  // 1. Direct PUT upload to S3/R2 presigned URL
  if (uploadUrl) {
    try {
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": mimeType,
        },
        body: file,
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
    const proxyUrl = `${proxyEndpoint}?s3Key=${encodeURIComponent(s3Key)}&mimeType=${encodeURIComponent(mimeType)}`;
    const proxyRes = await fetch(proxyUrl, {
      method: "POST",
      headers: {
        "Content-Type": mimeType,
      },
      body: file,
    });

    const proxyJson = await proxyRes.json();
    if (proxyRes.ok && proxyJson?.status) {
      return { status: true, mode: "proxy", ...proxyJson };
    }
    throw new Error(proxyJson?.message || `Proxy upload returned HTTP ${proxyRes.status}`);
  }

  throw new Error("Missing upload configuration for media file.");
}
