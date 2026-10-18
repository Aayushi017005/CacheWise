/**
 * In-memory Metrics Service for live API caching middleware
 */
class MetricsService {
  constructor() {
    this.reset();
  }

  reset() {
    this.totalRequests = 0;
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
    this.totalHitLatencyMs = 0;
    this.totalMissLatencyMs = 0;
    this.startedAt = new Date();
  }

  recordHit(latencyMs = 0) {
    this.totalRequests++;
    this.hits++;
    this.totalHitLatencyMs += latencyMs;
  }

  recordMiss(latencyMs = 0) {
    this.totalRequests++;
    this.misses++;
    this.totalMissLatencyMs += latencyMs;
  }

  recordEviction() {
    this.evictions++;
  }

  getStats() {
    const hitRatio = this.totalRequests > 0 ? Number((this.hits / this.totalRequests).toFixed(4)) : 0;
    const avgHitLatencyMs = this.hits > 0 ? Number((this.totalHitLatencyMs / this.hits).toFixed(2)) : 0;
    const avgMissLatencyMs = this.misses > 0 ? Number((this.totalMissLatencyMs / this.misses).toFixed(2)) : 0;

    return {
      totalRequests: this.totalRequests,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      hitRatio,
      hitRatioPercentage: Number((hitRatio * 100).toFixed(2)),
      avgHitLatencyMs,
      avgMissLatencyMs,
      uptimeSeconds: Math.floor((Date.now() - this.startedAt.getTime()) / 1000),
    };
  }
}

export const metricsService = new MetricsService();

