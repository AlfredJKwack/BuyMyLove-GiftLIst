// Cache for lazy-loaded modules to ensure they're only loaded once
const importCache = new Map();

/**
 * Lazy-load a module with caching
 * @param {Function} importFn - Dynamic import function (e.g., () => import('./module'))
 * @returns {Promise} Promise that resolves to the module
 */
export function lazyImport(importFn) {
  // Use the import function's string representation as cache key
  const cacheKey = importFn.toString();
  
  if (!importCache.has(cacheKey)) {
    importCache.set(cacheKey, importFn());
  }
  
  return importCache.get(cacheKey);
}
