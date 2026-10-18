import { createCache } from '../algorithms/cacheFactory.js';
import { config } from '../config/environment.js';
import { metricsService } from './metricsService.js';

class CacheService {
  constructor() {
    this.strategy = config.defaultCacheStrategy;
    this.capacity = config.defaultCacheCapacity;
    this.ttlMs = config.defaultCacheTtlMs;

    this.cache = createCache(this.strategy, this.capacity, this.ttlMs);
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, value, customTtlMs = null) {
    const ttl = customTtlMs !== null ? customTtlMs : this.ttlMs;
    const result = this.cache.set(key, value, ttl);

    if (result && result.evictedKey !== null) {
      metricsService.recordEviction();
    }

    return result;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
    metricsService.reset();
  }

  size() {
    return this.cache.size();
  }

  updateConfig({ strategy, capacity, ttlMs }) {
    let changed = false;

    if (strategy && strategy.toUpperCase() !== this.strategy) {
      this.strategy = strategy.toUpperCase();
      changed = true;
    }
    if (capacity !== undefined && capacity !== this.capacity) {
      this.capacity = Number(capacity);
      changed = true;
    }
    if (ttlMs !== undefined && ttlMs !== this.ttlMs) {
      this.ttlMs = Number(ttlMs);
      changed = true;
    }

    if (changed) {
      // Re-instantiate the cache with the new configuration
      this.cache = createCache(this.strategy, this.capacity, this.ttlMs);
      metricsService.reset();
    }

    return this.getConfig();
  }

  getConfig() {
    return {
      strategy: this.strategy,
      capacity: this.capacity,
      ttlMs: this.ttlMs,
    };
  }

  getStats() {
    const metrics = metricsService.getStats();
    return {
      config: this.getConfig(),
      size: this.size(),
      metrics,
    };
  }
}

export const cacheService = new CacheService();

