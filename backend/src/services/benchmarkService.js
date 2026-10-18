import { FifoCache } from '../algorithms/fifoCache.js';
import { LruCache } from '../algorithms/lruCache.js';
import { LfuCache } from '../algorithms/lfuCache.js';

/**
 * Run a benchmark simulation for a single cache strategy
 *
 * @param {typeof FifoCache | typeof LruCache | typeof LfuCache} CacheClass
 * @param {string} strategyName
 * @param {number} capacity
 * @param {number|null} ttlMs
 * @param {string[]} requests
 */
function benchmarkStrategy(CacheClass, strategyName, capacity, ttlMs, requests) {
  const cache = new CacheClass(capacity, ttlMs);
  let hits = 0;
  let misses = 0;
  let evictions = 0;

  const startTime = performance.now();

  for (const key of requests) {
    const cached = cache.get(key);
    if (cached !== null) {
      hits++;
    } else {
      misses++;
      const result = cache.set(key, { key, cachedAt: Date.now() }, ttlMs);
      if (result && result.evictedKey !== null) {
        evictions++;
      }
    }
  }

  const executionTimeMs = Number((performance.now() - startTime).toFixed(3));
  const totalRequests = requests.length;
  const hitRatio = totalRequests > 0 ? Number((hits / totalRequests).toFixed(4)) : 0;
  const hitRatioPercentage = Number((hitRatio * 100).toFixed(2));

  return {
    strategy: strategyName,
    totalRequests,
    hits,
    misses,
    evictions,
    hitRatio,
    hitRatioPercentage,
    executionTimeMs,
    finalCacheSize: cache.size(),
  };
}

/**
 * Execute benchmark comparison across FIFO, LRU, and LFU under identical workloads.
 *
 * @param {object} payload
 * @param {string} payload.name - Workload label
 * @param {number} payload.capacity - Cache capacity
 * @param {number|null} payload.ttlMs - TTL in milliseconds
 * @param {string[]} payload.requests - Request key sequence
 */
export function runBenchmark({ name = 'Custom Workload', capacity, ttlMs = null, requests }) {
  const fifoResult = benchmarkStrategy(FifoCache, 'FIFO', capacity, ttlMs, requests);
  const lruResult = benchmarkStrategy(LruCache, 'LRU', capacity, ttlMs, requests);
  const lfuResult = benchmarkStrategy(LfuCache, 'LFU', capacity, ttlMs, requests);

  const results = {
    FIFO: fifoResult,
    LRU: lruResult,
    LFU: lfuResult,
  };

  // Determine winning strategy by hit ratio
  let bestStrategy = 'LRU';
  let bestHitRatio = -1;

  for (const [strategy, res] of Object.entries(results)) {
    if (res.hitRatio > bestHitRatio) {
      bestHitRatio = res.hitRatio;
      bestStrategy = strategy;
    }
  }

  return {
    name,
    capacity,
    ttlMs,
    requestCount: requests.length,
    // Store bounded representation for summary display
    requestSequencePreview: requests.slice(0, 20),
    bestStrategy,
    results,
    timestamp: new Date().toISOString(),
  };
}

