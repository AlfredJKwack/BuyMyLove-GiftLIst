export const debug = import.meta.env.VITE_DEBUG === 'true';

export function log(...args) {
  if (debug) console.log(...args);
}
export function info(...args) {
  if (debug) console.info(...args);
}
export function warn(...args) {
  if (debug) console.warn(...args);
}
export function error(...args) {
  if (debug) console.error(...args);
}
