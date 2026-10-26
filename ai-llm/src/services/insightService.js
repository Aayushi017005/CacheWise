import { buildBenchmarkPrompt } from '../prompts/benchmarkExplanation.js';
import { requestLlmCompletion } from './llmService.js';

/**
 * Generate a deterministic engineering analysis when live LLM credentials are not configured or offline.
 */
function generateDeterministicAnalysis(benchmark) {
  const { name, capacity, results, bestStrategy, requestCount } = benchmark;
  const fifo = results.FIFO;
  const lru = results.LRU;
  const lfu = results.LFU;

  const maxHitRatio = Math.max(fifo.hitRatio, lru.hitRatio, lfu.hitRatio);
  const winners = ['LRU', 'LFU', 'FIFO'].filter((s) => results[s].hitRatio === maxHitRatio);
  const isTie = winners.length > 1;

  let outcomeSummary = '';
  if (isTie) {
    outcomeSummary = `In this simulated test workload, **${winners.join(' and ')} tied** for the highest performance with an identical hit ratio of **${(maxHitRatio * 100).toFixed(2)}%**.`;
  } else {
    outcomeSummary = `In this simulated test workload, **${bestStrategy}** delivered the highest performance with a hit ratio of **${(maxHitRatio * 100).toFixed(2)}%**.`;
  }

  let patternInsight = '';
  if (isTie && fifo.hitRatio === lru.hitRatio && lru.hitRatio === lfu.hitRatio) {
    patternInsight = 'All three caching policies achieved matching hit ratios. This typically occurs when the distinct working set comfortably fits inside cache capacity, or when request keys are evenly distributed without enough repetition to distinguish recency from frequency.';
  } else if (lru.hitRatio > fifo.hitRatio && lru.hitRatio >= lfu.hitRatio) {
    patternInsight = 'This simulated workload exhibits **temporal locality**—the principle that items accessed in the recent past are likely to be accessed again in the near future. LRU preserved these active keys in memory, whereas FIFO evicted them strictly based on arrival time regardless of recent accesses.';
  } else if (lfu.hitRatio > lru.hitRatio && lfu.hitRatio > fifo.hitRatio) {
    patternInsight = 'This simulated workload exhibits **frequency skew**—a pattern where a subset of popular ("hot") items receives repeated access over time. LFU preserved these frequently called keys even when newer keys arrived, outperforming recency-focused and arrival-based policies.';
  } else if (isTie && winners.includes('LRU') && winners.includes('LFU')) {
    patternInsight = 'Both LRU and LFU tied because the sequence combines repeated accesses to active items with stable access frequency, allowing both recency and frequency tracking to protect the working set equally.';
  } else {
    patternInsight = `The sequence demonstrated different eviction behaviors across policies, with ${isTie ? winners.join(' and ') : bestStrategy} best suited to this simulated request distribution.`;
  }

  return `### Performance Summary
${outcomeSummary}
- **LRU (Least Recently Used)**: ${(lru.hitRatio * 100).toFixed(2)}% hit ratio (${lru.hits} hits, ${lru.misses} misses, ${lru.evictions} evictions)
- **LFU (Least Frequently Used)**: ${(lfu.hitRatio * 100).toFixed(2)}% hit ratio (${lfu.hits} hits, ${lfu.misses} misses, ${lfu.evictions} evictions)
- **FIFO (First-In, First-Out)**: ${(fifo.hitRatio * 100).toFixed(2)}% hit ratio (${fifo.hits} hits, ${fifo.misses} misses, ${fifo.evictions} evictions)

### Workload Access Pattern Analysis
${patternInsight}
This benchmark was evaluated against a simulated test sequence of **${requestCount}** requests with a cache capacity of **${capacity}** entries.

Key concepts in this scenario:
- **Temporal Locality**: Accessing recently used data again. Algorithms that track recency (LRU) protect these items from premature eviction.
- **Frequency Skew**: Uneven distribution where select keys receive repeated requests. Frequency-aware policies (LFU) prioritize retaining high-count items.
- **Cache Thrashing**: When an access sequence continuously exceeds cache capacity, triggering repetitive evictions on every call.

### Engineering & Algorithmic Trade-offs
Each caching algorithm balances algorithmic complexity and access patterns:
- **FIFO (First-In, First-Out)**:
  - *Time Complexity*: O(1) lookups and insertions using a queue.
  - *Strengths*: Simple implementation with zero pointer manipulation during cache hits, eliminating write contention under heavy concurrent reads.
  - *Trade-offs*: Ignores how often or how recently keys are used, risking Belady's anomaly (where larger capacity can paradoxically cause more misses).
- **LRU (Least Recently Used)**:
  - *Time Complexity*: O(1) average lookup, update, and eviction using a Hash Map and Doubly Linked List.
  - *Strengths*: Highly effective for web sessions, product views, and conversational queries where recent activity predicts future requests.
  - *Trade-offs*: Every read hit moves a node to the front of the list, introducing write synchronization overhead in multithreaded environments.
- **LFU (Least Frequently Used)**:
  - *Time Complexity*: O(1) using frequency buckets with doubly linked lists.
  - *Strengths*: Ideal for stable popularity curves where top resources should remain cached indefinitely.
  - *Trade-offs*: Stale "historical hot items" can accumulate high counts and refuse to leave cache unless a counter decay or aging mechanism is used.

### Recommended Next Workload
To observe **Cyclic Cache Thrashing**, run a repeating loop whose unique keys exceed cache capacity by one (e.g. length **${capacity + 1}**). This will demonstrate how sequential loops without temporal overlap can drop LRU and FIFO hit ratios to 0%.`;
}

/**
 * Generate AI/LLM Insights for a benchmark result
 *
 * @param {object} benchmarkData
 * @returns {Promise<{ explanation: string, source: string, provider: string }>}
 */
export async function generateBenchmarkInsights(benchmarkData) {
  const prompt = buildBenchmarkPrompt(benchmarkData);

  // Attempt live LLM completion
  const llmResult = await requestLlmCompletion(prompt);

  if (llmResult && llmResult.content) {
    return {
      explanation: llmResult.content,
      source: 'llm-provider',
      provider: llmResult.provider,
    };
  }

  // Graceful rule-based educational fallback
  const fallbackExplanation = generateDeterministicAnalysis(benchmarkData);

  return {
    explanation: fallbackExplanation,
    source: 'educational-fallback',
    provider: 'Educational fallback',
  };
}
