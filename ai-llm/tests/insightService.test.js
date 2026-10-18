import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateBenchmarkInsights } from '../src/services/insightService.js';
import { validateBenchmarkData } from '../src/utils/validateBenchmark.js';

describe('AI/LLM Insight Service', () => {
  const sampleBenchmark = {
    name: 'Test Workload',
    capacity: 3,
    requestCount: 7,
    requestSequencePreview: ['A', 'B', 'A', 'C', 'D', 'A', 'B'],
    bestStrategy: 'LRU',
    results: {
      FIFO: { hits: 1, misses: 6, evictions: 3, hitRatio: 0.1429, executionTimeMs: 0.2 },
      LRU: { hits: 2, misses: 5, evictions: 2, hitRatio: 0.2857, executionTimeMs: 0.18 },
      LFU: { hits: 2, misses: 5, evictions: 2, hitRatio: 0.2857, executionTimeMs: 0.22 },
    },
  };

  it('should validate complete benchmark payload successfully', () => {
    const val = validateBenchmarkData(sampleBenchmark);
    assert.equal(val.isValid, true);
    assert.equal(val.errors.length, 0);
  });

  it('should reject invalid or incomplete benchmark payload', () => {
    const val = validateBenchmarkData({ capacity: 0 });
    assert.equal(val.isValid, false);
    assert.ok(val.errors.length > 0);
  });

  it('should generate structured explanation with all 4 technical sections', async () => {
    const insights = await generateBenchmarkInsights(sampleBenchmark);

    assert.ok(insights.explanation);
    assert.ok(insights.source);
    assert.ok(insights.provider);

    // Verify all 4 required sections are present
    assert.ok(insights.explanation.includes('Performance Summary'));
    assert.ok(insights.explanation.includes('Workload Access Pattern Analysis'));
    assert.ok(insights.explanation.includes('Engineering & Algorithmic Trade-offs'));
    assert.ok(insights.explanation.includes('Recommended Next Workload'));
    // Verify empirical winner is mentioned
    assert.ok(insights.explanation.includes('LRU'));
  });
});

