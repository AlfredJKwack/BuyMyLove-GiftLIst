/**
 * Safe localStorage operations that catch errors and handle SSR
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Safely get an item from localStorage
 * @param {string} key - The localStorage key
 * @returns {string|null} The stored value or null if not found/error
 */
export function getItem(key) {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem(key);
  } catch (err) {
    if (isDevelopment) {
      console.warn(`[localStorage] Failed to get item "${key}":`, err);
    }
    return null;
  }
}

/**
 * Safely set an item in localStorage
 * @param {string} key - The localStorage key
 * @param {string} value - The value to store
 * @returns {boolean} True if successful, false otherwise
 */
export function setItem(key, value) {
  if (typeof window === 'undefined') return false;
  
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    if (isDevelopment) {
      console.info(`[localStorage] Failed to store item "${key}":`, err);
    }
    return false;
  }
}

/**
 * Safely get and parse a JSON item from localStorage
 * @param {string} key - The localStorage key
 * @returns {any|null} The parsed value or null if not found/error
 */
export function getJSON(key) {
  const value = getItem(key);
  if (!value) return null;
  
  try {
    return JSON.parse(value);
  } catch (err) {
    if (isDevelopment) {
      console.error(`[localStorage] Failed to parse JSON for "${key}":`, err);
    }
    return null;
  }
}

/**
 * Safely stringify and set a JSON item in localStorage
 * @param {string} key - The localStorage key
 * @param {any} value - The value to stringify and store
 * @returns {boolean} True if successful, false otherwise
 */
export function setJSON(key, value) {
  try {
    return setItem(key, JSON.stringify(value));
  } catch (err) {
    if (isDevelopment) {
      console.error(`[localStorage] Failed to stringify value for "${key}":`, err);
    }
    return false;
  }
}
