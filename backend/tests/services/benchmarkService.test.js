import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runBenchmark } from '../../src/services/benchmarkService.js';

describe('BenchmarkService', () => {
  it('should compute exact deterministic metrics for the hand-calculated workload', () => {
    // Workload: ["A", "B", "A", "C", "D", "A", "B"], Capacity: 3
    const result = runBenchmark({
      name: 'Hand-Calculated Test',
      capacity: 3,
      ttlMs: 60000,
      requests: ['A', 'B', 'A', 'C', 'D', 'A', 'B'],
    });

    assert.equal(result.name, 'Hand-Calculated Test');
    assert.equal(result.capacity, 3);
    assert.equal(result.requestCount, 7);

    // FIFO:
    // A (miss), B (miss), A (hit), C (miss), D (evicts A), A (miss, evicts B), B (miss, evicts C)
    // Hits: 1, Misses: 6, Evictions: 3, Hit Ratio: 1/7 = 0.1429
    const fifo = result.results.FIFO;
    assert.equal(fifo.totalRequests, 7);
    assert.equal(fifo.hits, 1);
    assert.equal(fifo.misses, 6);
    assert.equal(fifo.evictions, 3);
    assert.equal(fifo.hitRatio, 0.1429);

    // LRU:
    // A (miss), B (miss), A (hit, MRU=A), C (miss), D (evicts B), A (hit, MRU=A), B (miss, evicts C)
    // Hits: 2, Misses: 5, Evictions: 2, Hit Ratio: 2/7 = 0.2857
    const lru = result.results.LRU;
    assert.equal(lru.totalRequests, 7);
    assert.equal(lru.hits, 2);
    assert.equal(lru.misses, 5);
    assert.equal(lru.evictions, 2);
    assert.equal(lru.hitRatio, 0.2857);

    // LFU:
    // Hits: 2, Misses: 5, Evictions: 2, Hit Ratio: 2/7 = 0.2857
    const lfu = result.results.LFU;
    assert.equal(lfu.totalRequests, 7);
    assert.equal(lfu.hits, 2);
    assert.equal(lfu.misses, 5);
    assert.equal(lfu.evictions, 2);
    assert.equal(lfu.hitRatio, 0.2857);

    // Execution time should be tracked as a positive number
    assert.ok(fifo.executionTimeMs >= 0);
    assert.ok(lru.executionTimeMs >= 0);
    assert.ok(lfu.executionTimeMs >= 0);

    // LRU and LFU share the highest ratio, so there is no unique winner.
    assert.equal(result.bestStrategy, 'Tie');
  });

  it('should report a tie when all strategies have zero hits', () => {
    const result = runBenchmark({
      name: 'Cyclic Loop (Cache Thrashing)',
      capacity: 3,
      ttlMs: 60000,
      requests: ['A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D'],
    });

    for (const strategy of ['FIFO', 'LRU', 'LFU']) {
      assert.equal(result.results[strategy].hits, 0);
      assert.equal(result.results[strategy].hitRatioPercentage, 0);
    }
    assert.equal(result.bestStrategy, 'Tie');
  });

  it('should keep LFU as the unique winner for the Frequency Skew workload', () => {
    const result = runBenchmark({
      name: 'Frequency Skew (Pareto / Hot Items)',
      capacity: 3,
      ttlMs: 60000,
      requests: ['A', 'A', 'A', 'B', 'B', 'C', 'D', 'A', 'A', 'B', 'E', 'A', 'B', 'F'],
    });

    assert.equal(result.bestStrategy, 'LFU');
    assert.equal(result.results.LFU.hits, 8);
    assert.equal(result.results.LFU.hitRatioPercentage, 57.14);
    assert.ok(result.results.LFU.hitRatio > result.results.LRU.hitRatio);
    assert.ok(result.results.LFU.hitRatio > result.results.FIFO.hitRatio);
  });

  it('should run benchmark on repeated single key correctly', () => {
    const result = runBenchmark({
      name: 'Single Key Repeats',
      capacity: 2,
      requests: ['X', 'X', 'X', 'X', 'X'],
    });

    for (const strat of ['FIFO', 'LRU', 'LFU']) {
      const data = result.results[strat];
      assert.equal(data.hits, 4);
      assert.equal(data.misses, 1);
      assert.equal(data.evictions, 0);
      assert.equal(data.hitRatio, 0.8);
    }

    assert.equal(result.bestStrategy, 'Tie');
  });
});
