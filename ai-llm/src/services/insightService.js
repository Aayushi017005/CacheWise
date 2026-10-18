import { buildBenchmarkPrompt } from '../prompts/benchmarkExplanation.js';
import { requestLlmCompletion } from './llmService.js';

/**
 * Generate a deterministic engineering analysis when LLM credentials are not configured or offline.
 */
function generateDeterministicAnalysis(benchmark) {
  const { name, capacity, results, bestStrategy, requestCount, requestSequencePreview } = benchmark;
  const fifo = results.FIFO;
  const lru = results.LRU;
  const lfu = results.LFU;

  let patternInsight = '';
  if (lru.hitRatio > fifo.hitRatio) {
    patternInsight = 'The workload displays strong **temporal locality**: items accessed recently were frequently requested again before eviction. LRU successfully protected these active items, whereas FIFO evicted them strictly based on their initial arrival time.';
  } else if (lfu.hitRatio > lru.hitRatio) {
    patternInsight = 'The workload exhibits **frequency skew (Pareto distribution)**: a small subset of hot keys was repeatedly requested over time. LFU preserved these high-frequency items regardless of how recently they were called, outperforming LRU.';
  } else if (fifo.hitRatio === lru.hitRatio && lru.hitRatio === lfu.hitRatio) {
    patternInsight = 'All three strategies achieved identical hit ratios. This typically occurs when the unique working set fits comfortably within the configured capacity, or when the request sequence is completely random with uniform access distribution.';
  } else {
    patternInsight = `The benchmark demonstrated varying performance across eviction policies. ${bestStrategy} performed best under this specific request distribution.`;
  }

  return `### 1. Performance Summary
- **Empirical Winner**: **${bestStrategy}**
- **LRU Hit Ratio**: ${(lru.hitRatio * 100).toFixed(2)}% (${lru.hits}/${lru.totalRequests} hits, ${lru.evictions} evictions)
- **LFU Hit Ratio**: ${(lfu.hitRatio * 100).toFixed(2)}% (${lfu.hits}/${lfu.totalRequests} hits, ${lfu.evictions} evictions)
- **FIFO Hit Ratio**: ${(fifo.hitRatio * 100).toFixed(2)}% (${fifo.hits}/${fifo.totalRequests} hits, ${fifo.evictions} evictions)

### 2. Workload Access Pattern Analysis
${patternInsight}
The sequence sample of **${requestCount}** requests with capacity **${capacity}** demonstrates how eviction criteria directly govern backend cache residency.

### 3. Engineering & Algorithmic Trade-offs
- **FIFO (First-In, First-Out)**:
  - *Time Complexity*: O(1) reads and writes using a singly/doubly linked queue.
  - *Pros*: Zero lock contention or node relocation on cache hits.
  - *Cons*: Ignores frequency and recency; susceptible to *Belady's Anomaly*.
- **LRU (Least Recently Used)**:
  - *Time Complexity*: O(1) average lookup and eviction using Doubly Linked List + Hash Map.
  - *Pros*: Natural fit for conversational sessions, web browsing, and recency-skewed microservices.
  - *Cons*: Requires pointer mutation on every read hit, which introduces write-lock overhead under heavy multithreaded read concurrency.
- **LFU (Least Frequently Used)**:
  - *Time Complexity*: O(1) using frequency buckets and doubly linked lists.
  - *Pros*: Retains consistently popular items indefinitely.
  - *Cons*: History pollution: outdated items with high historical counts occupy cache space unless an aging/decay mechanism is implemented.

### 4. Recommended Next Workload
To test **Cyclic Cache Thrashing**, run a looping sequence of length **${capacity + 1}** (e.g. \`[${Array.from({ length: capacity + 1 }, (_, i) => String.fromCharCode(65 + i)).join(', ')}, ${Array.from({ length: capacity + 1 }, (_, i) => String.fromCharCode(65 + i)).join(', ')}]\`). This reveals how LRU and FIFO suffer a 0% hit ratio due to cyclic evictions!`;
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
    source: 'rule-based-analyzer',
    provider: 'Built-in Educational Engine (Configure GEMINI_API_KEY in ai-llm/.env for live LLM responses)',
  };
}

