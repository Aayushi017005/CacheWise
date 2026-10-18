import { SUPPORTED_STRATEGIES } from '../algorithms/cacheFactory.js';

/**
 * Validate cache configuration options
 */
export function validateCacheConfig(config) {
  const errors = [];

  if (config.strategy !== undefined) {
    const strat = String(config.strategy).toUpperCase();
    if (!SUPPORTED_STRATEGIES.includes(strat)) {
      errors.push(`Invalid strategy "${config.strategy}". Must be one of: ${SUPPORTED_STRATEGIES.join(', ')}`);
    }
  }

  if (config.capacity !== undefined) {
    const cap = Number(config.capacity);
    if (!Number.isInteger(cap) || cap < 1 || cap > 100000) {
      errors.push('Capacity must be an integer between 1 and 100,000.');
    }
  }

  if (config.ttlMs !== undefined) {
    const ttl = Number(config.ttlMs);
    if (!Number.isInteger(ttl) || ttl < 0 || ttl > 86400000) {
      errors.push('TTL must be a non-negative integer up to 86,400,000 ms (24 hours).');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate benchmark execution request payload
 */
export function validateBenchmarkPayload(body) {
  const errors = [];

  if (!body || typeof body !== 'object') {
    return { isValid: false, errors: ['Request body must be a valid JSON object.'] };
  }

  const { capacity, requests, ttlMs, name } = body;

  const cap = Number(capacity);
  if (!Number.isInteger(cap) || cap < 1 || cap > 10000) {
    errors.push('Capacity must be an integer between 1 and 10,000.');
  }

  if (!Array.isArray(requests) || requests.length === 0) {
    errors.push('Requests must be a non-empty array of keys.');
  } else if (requests.length > 50000) {
    errors.push('Requests array exceeds the maximum limit of 50,000 items.');
  }

  if (ttlMs !== undefined && ttlMs !== null) {
    const ttl = Number(ttlMs);
    if (!Number.isInteger(ttl) || ttl < 0) {
      errors.push('TTL must be a non-negative integer.');
    }
  }

  if (name !== undefined && (typeof name !== 'string' || name.length > 100)) {
    errors.push('Workload name must be a string up to 100 characters.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

