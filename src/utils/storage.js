import fs from 'fs/promises';
import path from 'path';
import { getCurrentDate, isDateFormat, isOlderThan } from './date.js';
import { config } from '../config.js';

/**
 * Storage manager for handling file operations
 * Following the pattern from cyclescope-downloader
 */

/**
 * Get the data directory path
 * @returns {string} Data directory path
 */
export function getDataDir() {
  return config.storage.dataDir;
}

/**
 * Get the directory path for a specific date
 * @param {string} [date] - Date in YYYY-MM-DD format, defaults to current date
 * @returns {string} Date directory path
 */
export function getDateDir(date = getCurrentDate()) {
  return path.join(getDataDir(), date);
}

/**
 * Ensure data directory exists
 * @returns {Promise<void>}
 */
export async function ensureDataDir() {
  const dataDir = getDataDir();
  try {
    await fs.mkdir(dataDir, { recursive: true });
    console.log(`[Storage] Data directory ensured: ${dataDir}`);
  } catch (error) {
    console.error(`[Storage] Error creating data directory: ${error.message}`);
    throw error;
  }
}

/**
 * Ensure date directory exists for a specific date
 * @param {string} [date] - Date in YYYY-MM-DD format, defaults to current date
 * @returns {Promise<string>} Path to the date directory
 */
export async function ensureDateDir(date = getCurrentDate()) {
  const dateDir = getDateDir(date);
  try {
    await fs.mkdir(dateDir, { recursive: true });
    console.log(`[Storage] Date directory ensured: ${dateDir}`);
    return dateDir;
  } catch (error) {
    console.error(`[Storage] Error creating date directory: ${error.message}`);
    throw error;
  }
}

/**
 * Get file path for a specific file in a date directory
 * @param {string} filename - File name
 * @param {string} [date] - Date in YYYY-MM-DD format, defaults to current date
 * @returns {string} Full file path
 */
export function getFilePath(filename, date = getCurrentDate()) {
  return path.join(getDateDir(date), filename);
}

/**
 * Save file to date directory
 * @param {string} filename - File name
 * @param {Buffer|string} data - File data
 * @param {string} [date] - Date in YYYY-MM-DD format, defaults to current date
 * @returns {Promise<string>} Path to saved file
 */
export async function saveFile(filename, data, date = getCurrentDate()) {
  await ensureDateDir(date);
  const filePath = getFilePath(filename, date);
  
  try {
    await fs.writeFile(filePath, data);
    console.log(`[Storage] File saved: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error(`[Storage] Error saving file: ${error.message}`);
    throw error;
  }
}

/**
 * Read file from date directory
 * @param {string} filename - File name
 * @param {string} [date] - Date in YYYY-MM-DD format, defaults to current date
 * @returns {Promise<Buffer>} File data
 */
export async function readFile(filename, date = getCurrentDate()) {
  const filePath = getFilePath(filename, date);
  
  try {
    const data = await fs.readFile(filePath);
    console.log(`[Storage] File read: ${filePath}`);
    return data;
  } catch (error) {
    console.error(`[Storage] Error reading file: ${error.message}`);
    throw error;
  }
}

/**
 * Check if file exists in date directory
 * @param {string} filename - File name
 * @param {string} [date] - Date in YYYY-MM-DD format, defaults to current date
 * @returns {Promise<boolean>} True if file exists
 */
export async function fileExists(filename, date = getCurrentDate()) {
  const filePath = getFilePath(filename, date);
  
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * List all date directories
 * @returns {Promise<string[]>} Array of date strings in YYYY-MM-DD format, sorted newest first
 */
export async function listDateDirs() {
  const dataDir = getDataDir();
  
  try {
    const entries = await fs.readdir(dataDir, { withFileTypes: true });
    const dateDirs = entries
      .filter(entry => entry.isDirectory() && isDateFormat(entry.name))
      .map(entry => entry.name)
      .sort()
      .reverse();
    
    return dateDirs;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    console.error(`[Storage] Error listing date directories: ${error.message}`);
    throw error;
  }
}

/**
 * Get the latest date directory
 * @returns {Promise<string|null>} Latest date string or null if none exist
 */
export async function getLatestDateDir() {
  const dateDirs = await listDateDirs();
  return dateDirs.length > 0 ? dateDirs[0] : null;
}

/**
 * Clean up old date directories beyond retention period
 * @returns {Promise<number>} Number of directories removed
 */
export async function cleanupOldDirs() {
  const retentionDays = config.storage.retentionDays;
  const dateDirs = await listDateDirs();
  
  let removedCount = 0;
  
  for (const dateDir of dateDirs) {
    if (isOlderThan(dateDir, retentionDays)) {
      const dirPath = getDateDir(dateDir);
      try {
        await fs.rm(dirPath, { recursive: true, force: true });
        console.log(`[Storage] Removed old directory: ${dirPath}`);
        removedCount++;
      } catch (error) {
        console.error(`[Storage] Error removing directory ${dirPath}: ${error.message}`);
      }
    }
  }
  
  if (removedCount > 0) {
    console.log(`[Storage] Cleanup complete: ${removedCount} directories removed`);
  } else {
    console.log(`[Storage] Cleanup complete: No old directories to remove`);
  }
  
  return removedCount;
}

export default {
  getDataDir,
  getDateDir,
  ensureDataDir,
  ensureDateDir,
  getFilePath,
  saveFile,
  readFile,
  fileExists,
  listDateDirs,
  getLatestDateDir,
  cleanupOldDirs
};
