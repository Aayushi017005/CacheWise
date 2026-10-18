/**
 * Construct a safe, deterministic cache key from an Express request.
 *
 * Rules:
 * - Method in uppercase.
 * - Normalized path (lowercased without trailing slash).
 * - Query parameters sorted alphabetically by key so param order does not bust the cache.
 *
 * Example: GET /api/demo/products/123?sort=asc&limit=10
 * Result:  GET:/api/demo/products/123?limit=10&sort=asc
 *
 * @param {import('express').Request} req
 * @returns {string}
 */
export function generateCacheKey(req) {
  const method = req.method.toUpperCase();
  const rawPath = req.baseUrl ? `${req.baseUrl}${req.path}` : req.path;
  const normalizedPath = rawPath.replace(/\/+$/, '') || '/';

  const queryKeys = Object.keys(req.query || {}).sort();
  if (queryKeys.length === 0) {
    return `${method}:${normalizedPath}`;
  }

  const sortedQueryParams = queryKeys
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(req.query[key])}`)
    .join('&');

  return `${method}:${normalizedPath}?${sortedQueryParams}`;
}

