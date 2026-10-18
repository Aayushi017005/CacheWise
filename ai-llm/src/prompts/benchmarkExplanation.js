/**
 * Construct the prompt for explaining benchmark results
 *
 * @param {object} benchmark
 * @returns {string}
 */
export function buildBenchmarkPrompt(benchmark) {
  const { name, capacity, ttlMs, requestCount, requestSequencePreview, results, bestStrategy } = benchmark;

  const fifo = results.FIFO;
  const lru = results.LRU;
  const lfu = results.LFU;

  return `
You are a Staff Backend Systems Engineer specializing in caching architectures, data structures, and algorithm performance.

Analyze the following empirical cache benchmark results and generate a concise, educational, and technically rigorous explanation for a software engineering candidate.

---
BENCHMARK CONFIGURATION:
- Workload Name: ${name || 'Synthetic Cache Workload'}
- Cache Capacity: ${capacity} entries
- Default TTL: ${ttlMs ? `${ttlMs} ms` : 'None (capacity eviction only)'}
- Total Requests: ${requestCount}
- Sample Sequence Preview: [${(requestSequencePreview || []).join(', ')}]

MEASURED EMPIRICAL RESULTS:
1. FIFO (First-In First-Out):
   - Hits: ${fifo.hits} | Misses: ${fifo.misses} | Evictions: ${fifo.evictions}
   - Hit Ratio: ${(fifo.hitRatio * 100).toFixed(2)}% | Execution Time: ${fifo.executionTimeMs}ms

2. LRU (Least Recently Used):
   - Hits: ${lru.hits} | Misses: ${lru.misses} | Evictions: ${lru.evictions}
   - Hit Ratio: ${(lru.hitRatio * 100).toFixed(2)}% | Execution Time: ${lru.executionTimeMs}ms

3. LFU (Least Frequently Used):
   - Hits: ${lfu.hits} | Misses: ${lfu.misses} | Evictions: ${lfu.evictions}
   - Hit Ratio: ${(lfu.hitRatio * 100).toFixed(2)}% | Execution Time: ${lfu.executionTimeMs}ms

Empirical Winner: ${bestStrategy}

---
OUTPUT REQUIREMENTS:
Provide your explanation in standard Markdown format adhering strictly to these four sections:

### 1. Performance Summary
Briefly state the winning strategy (${bestStrategy}) and compare the exact hit ratios achieved by FIFO, LRU, and LFU. Never contradict or round away the measured numbers.

### 2. Workload Access Pattern Analysis
Explain why this specific request sequence resulted in this outcome. Address the presence or absence of:
- Temporal Locality (accessing recently used items again)
- Frequency Skew (certain keys accessed disproportionately often)
- Loop / Cyclic Thrashing (sequences larger than capacity that cause eviction cascading)

### 3. Engineering & Algorithmic Trade-offs
Discuss the real-world trade-offs between FIFO, LRU, and LFU:
- FIFO: Minimal pointer overhead, immune to read contention on cache hits, but ignores temporal and frequency signals (Belady's anomaly risk).
- LRU: Excellent for recency bursts; requires updating doubly linked list pointers on every single read hit (read-write lock contention).
- LFU: Optimal for stable popularity distributions; risks cache pollution from historical frequency spikes without aging/decay.

### 4. Recommended Next Workload
Suggest a concrete, specific request sequence (e.g., a Zipfian distribution, a loop of length capacity + 1, or a burst of new keys) to test next, explaining what architectural phenomenon it will demonstrate.

Note: Do NOT claim any single caching strategy is universally superior. Focus on how access distribution dictates algorithmic efficiency.
`.trim();
}

