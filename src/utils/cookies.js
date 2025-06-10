/**
 * Cookie management utilities
 */

const COOKIE_ID_KEY = 'gift_buyer_id';
const COOKIE_EXPIRY_DAYS = 365; // 1 year

/**
 * Get a cookie value by name
 * @param {string} name - The name of the cookie
 * @returns {string|null} The cookie value or null if not found
 */
export const getCookie = (name) => {
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(name + '=')) {
      return cookie.substring(name.length + 1);
    }
  }
  return null;
};

/**
 * Set a cookie
 * @param {string} name - The name of the cookie
 * @param {string} value - The value to set
 * @param {number} days - The number of days until the cookie expires
 */
export const setCookie = (name, value, days) => {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
};

/**
 * Get the cookie ID for the current user, creating one if it doesn't exist
 * @returns {string} The cookie ID
 */
export const getCookieId = () => {
  let cookieId = getCookie(COOKIE_ID_KEY);
  if (!cookieId) {
    cookieId = crypto.randomUUID();
    setCookie(COOKIE_ID_KEY, cookieId, COOKIE_EXPIRY_DAYS);
  }
  return cookieId;
};

/**
 * Set the cookie ID for the current user
 * @param {string} id - The cookie ID to set
 */
export const setCookieId = (id) => {
  setCookie(COOKIE_ID_KEY, id, COOKIE_EXPIRY_DAYS);
};
