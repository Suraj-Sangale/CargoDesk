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
