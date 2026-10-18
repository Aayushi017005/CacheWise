import { generateCacheKey } from '../utils/cacheKey.js';
import { cacheService } from '../services/cacheService.js';
import { metricsService } from '../services/metricsService.js';

/**
 * Cache Middleware for Express routes.
 *
 * Provides transparent response caching for GET endpoints:
 * - Emits X-Cache: HIT or X-Cache: MISS.
 * - Emits X-Response-Time in milliseconds.
 * - Records latency and cache hit/miss in metricsService.
 * - Only caches successful responses (2xx status codes).
 *
 * @param {object} options
 * @param {number|null} options.ttlMs - Custom TTL override for this route
 */
export function createCacheMiddleware(options = {}) {
  const { ttlMs = null } = options;

  return function cacheMiddleware(req, res, next) {
    // Only GET requests are eligible for caching
    if (req.method !== 'GET') {
      return next();
    }

    const startTime = performance.now();
    const cacheKey = generateCacheKey(req);
    const cachedResponse = cacheService.get(cacheKey);

    if (cachedResponse !== null && cachedResponse !== undefined) {
      const durationMs = Number((performance.now() - startTime).toFixed(2));
      metricsService.recordHit(durationMs);

      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Response-Time', `${durationMs}ms`);
      res.setHeader('X-Cache-Key', cacheKey);

      return res.status(200).json(cachedResponse);
    }

    // Cache Miss: intercept res.json to capture response body
    res.setHeader('X-Cache', 'MISS');
    const originalJson = res.json.bind(res);

    res.json = function (body) {
      const durationMs = Number((performance.now() - startTime).toFixed(2));
      metricsService.recordMiss(durationMs);

      res.setHeader('X-Response-Time', `${durationMs}ms`);
      res.setHeader('X-Cache-Key', cacheKey);

      // Only cache successful (2xx) responses
      if (res.statusCode >= 200 && res.statusCode < 300 && body !== undefined) {
        cacheService.set(cacheKey, body, ttlMs);
      }

      return originalJson(body);
    };

    next();
  };
}

export const cacheMiddleware = createCacheMiddleware();

