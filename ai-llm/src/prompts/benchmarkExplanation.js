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

  // Determine if there is a tie for top performance
  const maxHitRatio = Math.max(fifo.hitRatio, lru.hitRatio, lfu.hitRatio);
  const winners = ['LRU', 'LFU', 'FIFO'].filter((s) => results[s].hitRatio === maxHitRatio);
  const isTie = winners.length > 1;
  const winnerSummary = isTie
    ? `Tied between ${winners.join(' and ')} (both achieved ${(maxHitRatio * 100).toFixed(2)}% hit ratio)`
    : `${bestStrategy} (achieved ${(maxHitRatio * 100).toFixed(2)}% hit ratio)`;

  return `
You are an expert Systems Architect explaining in-memory caching algorithms to a software engineer.

Analyze the following empirical cache benchmark results and generate an educational, readable explanation.

---
BENCHMARK CONFIGURATION:
- Workload Description: ${name || 'Simulated Cache Workload'} (Note: This is a synthetic test workload, not production traffic)
- Cache Capacity: ${capacity} items
- Default TTL: ${ttlMs ? `${ttlMs} ms` : 'None (eviction solely on capacity)'}
- Total Requests in Sequence: ${requestCount}
- Sample Sequence Preview: [${(requestSequencePreview || []).join(', ')}]

MEASURED EMPIRICAL RESULTS (Authoritative - do not invent or alter these values):
1. FIFO (First-In First-Out):
   - Hits: ${fifo.hits} | Misses: ${fifo.misses} | Evictions: ${fifo.evictions}
   - Hit Ratio: ${(fifo.hitRatio * 100).toFixed(2)}% | Execution Time: ${fifo.executionTimeMs}ms

2. LRU (Least Recently Used):
   - Hits: ${lru.hits} | Misses: ${lru.misses} | Evictions: ${lru.evictions}
   - Hit Ratio: ${(lru.hitRatio * 100).toFixed(2)}% | Execution Time: ${lru.executionTimeMs}ms

3. LFU (Least Frequently Used):
   - Hits: ${lfu.hits} | Misses: ${lfu.misses} | Evictions: ${lfu.evictions}
   - Hit Ratio: ${(lfu.hitRatio * 100).toFixed(2)}% | Execution Time: ${lfu.executionTimeMs}ms

Empirical Outcome: ${winnerSummary}

---
OUTPUT REQUIREMENTS:
Produce clear, readable markdown adhering to these four sections:

### Performance Summary
State the empirical outcome accurately (${winnerSummary}). Never claim an algorithm won alone if there was a tie. Summarize the exact hit ratios achieved by FIFO, LRU, and LFU without contradicting the measured numbers.

### Workload Access Pattern Analysis
Explain why this synthetic sequence favored the outcome. Address and explain any relevant technical concepts when introduced:
- Temporal Locality: The tendency to re-access items that were used in the recent past.
- Frequency Skew: When a small set of popular keys receives the majority of requests.
- Cache Thrashing: When an access loop is larger than cache capacity, causing continuous evictions.

### Engineering & Algorithmic Trade-offs
Explain the real-world trade-offs between FIFO, LRU, and LFU in plain, accessible English:
- FIFO: Very low overhead because reads do not mutate cache order, but risks evicting frequently or recently needed data (Belady's anomaly).
- LRU: Ideal when recent items are requested again, but requires updating pointers on every cache hit, which can introduce write contention in concurrent environments.
- LFU: Keeps consistently popular items cached, but risks holding onto obsolete items if historical counts remain high without decay.

### Recommended Next Workload
Suggest a concrete follow-up synthetic sequence to test next (such as a cyclic loop or burst of unique keys) and explain the caching behavior it will demonstrate.

Style Guidelines:
- Write in polished, clear, engaging English.
- Do not repeat the same conclusions across sections.
- Avoid excessive jargon, malformed lists, and empty generic filler.
- Do not claim any single caching strategy is universally best.
`.trim();
}
