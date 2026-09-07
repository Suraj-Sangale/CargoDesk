import { constantsList } from "@/constants";
import moment from "moment";
import { DOCUMENTS_TYPE_LIST } from "./dummyData";
const crypto = require("crypto");
import jwt from "jsonwebtoken";
import { parseCookies } from "nookies";

export const getUniqueKey = (length = 12) => {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const formatDate = (date, format = 1) => {
  let formattedDate = "";
  if (!date) {
    formattedDate = "-";
  }

  if (format == 1) {
    formattedDate = moment(date).format("DD MMM, YYYY");
  }
  return formattedDate;
};

export const getConstant = (key) => {
  return constantsList[key.toUpperCase()] ?? null;
};

export const getDataFromLocalStorage = (keyName) => {
  let data = JSON.parse(localStorage.getItem(keyName));
  return data;
};

export const getDateBeforeDays = (date, days) => {
  if (!date || typeof days !== "number") return "-";
  return moment(date).subtract(days, "days").format("DD MMM, YYYY");
};

export const truncateString = (input, maxLength = 20) => {
  if (!input) return "";
  const words = input.split(" ");
  if (words.length > 3 || input.length > maxLength) {
    return input.substring(0, maxLength).trim() + "...";
  }
  return input;
};

export const formatVehicleNumber = (vehicleNumber = "") => {
  if (!vehicleNumber) return "";

  // Ensure input is uppercase
  const upperCaseNumber =
    vehicleNumber && vehicleNumber != "" && vehicleNumber?.toUpperCase();

  // Flexible pattern for Indian vehicle numbers
  const regex = /^([A-Z]{2})(\d{1,2})([A-Z]{0,2})(\d{1,4})$/;
  return upperCaseNumber.replace(regex, (_, state, rto, series, number) => {
    return [state, rto, series, number].filter(Boolean).join(" ");
  });
};

export const checkBotUserAgent = (userAgent) => {
  return Boolean(
    userAgent.match(/bot|googlebot|crawler|spider|robot|crawling/i)
  );
};

export const checkUserDeviceTypeByUserAgent = (userAgent) => {
  return Boolean(
    userAgent.match(
      /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i
    )
  );
};

export const checkExpiryCounts = (data) => {
  const result = DOCUMENTS_TYPE_LIST.map((doc) => ({
    ...doc,
    expiredCount: 0,
    withinMonthExpiryCount: 0,
    totalCount: 0, // New field for total count
  }));

  data.forEach((item) => {
    const expiryDate = moment(item.expiryDate);
    const document = result.find((doc) => doc.value === item.documentType);

    if (document) {
      const isWithinMonth = expiryDate.isBetween(
        moment(),
        moment().add(getConstant("DAYS_BEFORE_ALERT"), "days"),
        "day",
        "[]"
      );

      const isExpired = expiryDate.isBefore(moment());

      // Count for within month and expired
      if (isWithinMonth && !isExpired) {
        document.withinMonthExpiryCount += 1;
      }
      if (isExpired) {
        document.expiredCount += 1;
      }
      // Increment total count for each matched document
      document.totalCount += 1;
    }
  });

  return result;
};
export const hashWithSHA256 = (input) => {
  return crypto.createHash("sha256").update(input).digest("hex");
};

export function setCookie(name, value, expiry = null) {
  let cookie = "; path=/";
  if (expiry != null) {
    let date = new Date();
    date.setTime(date.getTime() + expiry * 60 * 1000);
    const expires = "; expires=" + date.toUTCString();
    cookie = expires + "; path=/";
  }

  document.cookie = name + "=" + (value || "") + cookie;
}

export const getCookie = (name) => {
  if (typeof document == "undefined") return null;

  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (var i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export function deleteCookie(name) {
  document.cookie = name + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
}

export const convertFirstLetterCapital = (text) => {
  if (typeof text == "undefined" || typeof text == "null" || text == null)
    return "";

  try {
    return text.charAt(0).toUpperCase() + text.slice(1);
  } catch (error) {
    console.log("catch", error);
    return "";
  }
};
// ✅ Decode and verify token using SECRET_KEY
export function getCurrentToken(token) {
  if (!token) return null;

  const secret = process.env.SECRET_KEY;

  if (!secret) {
    console.error("❌ SECRET_KEY is not defined in your environment");
    return null;
  }

  try {
    const decoded = jwt.verify(token, secret); // Verifies signature and expiry
    return decoded;
  } catch (err) {
    console.error("❌ Invalid or expired token:", err.message);
    return null;
  }
}

// ✅ Middleware-like helper for getServerSideProps
export async function requireAuth(context, callback) {
  const cookies = parseCookies(context);
  const token = cookies.auth_token;

  // If no token, redirect to login
  if (!token) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  // Decode and verify token
  const decoded = getCurrentToken(token);

  if (!decoded) {
    // If token invalid or expired, redirect to login
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  // ✅ Token is valid, proceed with the callback
  return await callback(decoded);
}
// ✅ Common price formatting function
export function formatPrice(amount, currency = false) {
  if (amount === null || amount === undefined || isNaN(amount)) return "0";

  return new Intl.NumberFormat("en-IN", {
    style: currency ? "currency" : "decimal",
    currency: currency || "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function convertToUpperCase(text) {
  if (typeof text !== "string") {
    throw new Error("Input must be a string");
  }
  return text.toUpperCase();
}

export const scrollSectionIntoView = (id) => {
  const element = document.getElementById(id);

  if (element) {
    element.style.scrollMarginTop = "100px";

    setTimeout(() => {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }
};