/**
 * Date utility functions
 * Following the pattern from cyclescope-downloader
 */

/**
 * Get current date in YYYY-MM-DD format
 * @param {Date} [date] - Optional date object, defaults to current date
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function getCurrentDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get date N days ago in YYYY-MM-DD format
 * @param {number} daysAgo - Number of days ago
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function getDateDaysAgo(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return getCurrentDate(date);
}

/**
 * Check if a string matches the YYYY-MM-DD format
 * @param {string} str - String to check
 * @returns {boolean} True if matches date format
 */
export function isDateFormat(str) {
  return /^\d{4}-\d{2}-\d{2}$/.test(str);
}

/**
 * Parse YYYY-MM-DD string to Date object
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {Date} Date object
 */
export function parseDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Check if a date is older than N days
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @param {number} days - Number of days
 * @returns {boolean} True if date is older than N days
 */
export function isOlderThan(dateStr, days) {
  const date = parseDate(dateStr);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return date < cutoffDate;
}

/**
 * Get ISO timestamp for current time
 * @returns {string} ISO 8601 timestamp
 */
export function getTimestamp() {
  return new Date().toISOString();
}

export default {
  getCurrentDate,
  getDateDaysAgo,
  isDateFormat,
  parseDate,
  isOlderThan,
  getTimestamp
};
