import { FifoCache } from './fifoCache.js';
import { LruCache } from './lruCache.js';
import { LfuCache } from './lfuCache.js';

export const SUPPORTED_STRATEGIES = ['FIFO', 'LRU', 'LFU'];

/**
 * Cache Factory to instantiate cache algorithms with a uniform interface.
 *
 * @param {string} strategy - 'FIFO' | 'LRU' | 'LFU'
 * @param {number} capacity - Positive integer maximum capacity
 * @param {number|null} defaultTtlMs - Default time-to-live in milliseconds
 * @returns {FifoCache | LruCache | LfuCache}
 */
export function createCache(strategy = 'LRU', capacity = 100, defaultTtlMs = null) {
  const normalizedStrategy = String(strategy).trim().toUpperCase();

  switch (normalizedStrategy) {
    case 'FIFO':
      return new FifoCache(capacity, defaultTtlMs);
    case 'LRU':
      return new LruCache(capacity, defaultTtlMs);
    case 'LFU':
      return new LfuCache(capacity, defaultTtlMs);
    default:
      throw new Error(
        `Unsupported cache strategy: "${strategy}". Supported strategies are: ${SUPPORTED_STRATEGIES.join(', ')}`
      );
  }
}

