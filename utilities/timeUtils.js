import moment from "moment";

/**
 * Standardized Time Management Utilities for India Local Time (IST / UTC+05:30).
 *
 * Ensures consistent parsing, formatting, and submission of dates and times
 * across client components, backend models, and API endpoints.
 */

export const INDIA_TIMEZONE_OFFSET = "+05:30";
export const INDIA_TIMEZONE_NAME = "Asia/Kolkata";

/**
 * Normalizes any date input (ISO string, MySQL datetime, Date object, or pure date)
 * into a Moment instance locked to India Standard Time (+05:30).
 *
 * @param {string|Date|moment.Moment|null} [dateInput] - Input date or timestamp
 * @returns {moment.Moment}
 */
export function getIndiaMoment(dateInput = null) {
  if (!dateInput) {
    return moment().utcOffset(INDIA_TIMEZONE_OFFSET);
  }

  // If input is already a moment object, ensure it's in India offset
  if (moment.isMoment(dateInput)) {
    return dateInput.clone().utcOffset(INDIA_TIMEZONE_OFFSET);
  }

  // If input is a pure date string (YYYY-MM-DD), parse directly to avoid timezone day-shift
  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    return moment(dateInput.trim(), "YYYY-MM-DD");
  }

  // Parse as UTC then convert to India timezone (+05:30)
  return moment.utc(dateInput).utcOffset(INDIA_TIMEZONE_OFFSET);
}

/**
 * Formats a date/timestamp into "DD MMM YYYY, hh:mm A" in India local time.
 * Example: "19 Nov 2026, 12:15 AM"
 *
 * @param {string|Date|null} dateInput
 * @param {string} [fallback=""]
 * @param {string} [format="DD MMM YYYY, hh:mm A"]
 * @returns {string}
 */
export function formatIndiaDateTime(
  dateInput,
  fallback = "",
  format = "DD MMM YYYY, hh:mm A"
) {
  if (!dateInput) return fallback;
  return getIndiaMoment(dateInput).format(format);
}

/**
 * Formats a date into "DD MMM YYYY" in India local time.
 * Example: "19 Nov 2026"
 *
 * @param {string|Date|null} dateInput
 * @param {string} [fallback=""]
 * @param {string} [format="DD MMM YYYY"]
 * @returns {string}
 */
export function formatIndiaDate(
  dateInput,
  fallback = "",
  format = "DD MMM YYYY"
) {
  if (!dateInput) return fallback;
  return getIndiaMoment(dateInput).format(format);
}

/**
 * Formats a timestamp into time only "hh:mm A" in India local time.
 * Example: "12:15 AM"
 *
 * @param {string|Date|null} dateInput
 * @param {string} [fallback=""]
 * @param {string} [format="hh:mm A"]
 * @returns {string}
 */
export function formatIndiaTime(
  dateInput,
  fallback = "",
  format = "hh:mm A"
) {
  if (!dateInput) return fallback;
  return getIndiaMoment(dateInput).format(format);
}

/**
 * Returns a standardized "YYYY-MM-DD" date string in India local time.
 * If no argument provided, returns today's date in India.
 *
 * @param {string|Date|null} [dateInput]
 * @returns {string}
 */
export function getIndiaDateString(dateInput = null) {
  return getIndiaMoment(dateInput).format("YYYY-MM-DD");
}

/**
 * Returns current or specified time in India "hh:mm A" format.
 *
 * @param {string|Date|null} [dateInput]
 * @param {string} [format="hh:mm A"]
 * @returns {string}
 */
export function getIndiaTimeString(dateInput = null, format = "hh:mm A") {
  return getIndiaMoment(dateInput).format(format);
}

/**
 * Checks whether a given date falls on today in India Standard Time.
 *
 * @param {string|Date|null} dateInput
 * @returns {boolean}
 */
export function isTodayIndia(dateInput) {
  if (!dateInput) return false;
  const m = getIndiaMoment(dateInput);
  const today = getIndiaMoment();
  return m.isSame(today, "day");
}

/**
 * Returns an ISO 8601 string representation with the India +05:30 offset.
 * Example: "2026-11-19T00:21:05+05:30"
 *
 * @param {string|Date|null} [dateInput]
 * @returns {string}
 */
export function getIndiaISOString(dateInput = null) {
  return getIndiaMoment(dateInput).toISOString(true);
}

export default {
  INDIA_TIMEZONE_OFFSET,
  INDIA_TIMEZONE_NAME,
  getIndiaMoment,
  formatIndiaDateTime,
  formatIndiaDate,
  formatIndiaTime,
  getIndiaDateString,
  getIndiaTimeString,
  isTodayIndia,
  getIndiaISOString,
};
