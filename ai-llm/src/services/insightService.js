import { buildBenchmarkPrompt } from '../prompts/benchmarkExplanation.js';
import { requestLlmCompletion } from './llmService.js';

const REQUIRED_SECTIONS = [
  '### Performance Summary',
  '### Workload Access Pattern Analysis',
  '### Engineering & Algorithmic Trade-offs',
  '### Recommended Next Workload',
];

function isCompleteExplanation(text) {
  if (typeof text !== 'string' || text.trim().length < 500) return false;
  if (!REQUIRED_SECTIONS.every((heading) => text.includes(heading))) return false;
  // Reject common signs of a cut-off response rather than displaying broken prose.
  if (/(?:\*\*|\*|\(|\[)\s*$/.test(text.trim())) return false;
  const lastSection = text.slice(text.lastIndexOf('### Recommended Next Workload'));
  return lastSection.trim().length >= 80 && /[.!?]`?$/.test(lastSection.trim());
}

/** Generate a deterministic, data-grounded explanation if the LLM is unavailable or incomplete. */
function generateDeterministicAnalysis(benchmark) {
  const { capacity, results, bestStrategy, requestCount, requestSequencePreview = [] } = benchmark;
  const fifo = results.FIFO;
  const lru = results.LRU;
  const lfu = results.LFU;
  const maxHitRatio = Math.max(fifo.hitRatio, lru.hitRatio, lfu.hitRatio);
  const winners = ['LRU', 'LFU', 'FIFO'].filter((strategy) => results[strategy].hitRatio === maxHitRatio);
  const isTie = winners.length > 1;

  const outcomeSummary = isTie
    ? `All three cache policies are tied at **${(maxHitRatio * 100).toFixed(2)}%** hit ratio.`
    : `**${bestStrategy}** has the highest measured hit ratio at **${(maxHitRatio * 100).toFixed(2)}%**.`;

  let patternInsight;
  if (fifo.hits === 0 && lru.hits === 0 && lfu.hits === 0) {
    patternInsight = `Every request was a cache miss for all three policies. With capacity **${capacity}**, this run produced no cache hits, so no policy outperformed the others. If the sequence repeatedly cycles through more unique keys than the cache can hold, this is consistent with cache thrashing.`;
  } else if (fifo.hitRatio === lru.hitRatio && lru.hitRatio === lfu.hitRatio) {
    patternInsight = `All three policies produced the same measured hit ratio for this particular sequence. The results show no performance winner for this run; equal hit ratios do not by themselves prove that the workload fits in cache.`;
  } else if (lru.hitRatio > fifo.hitRatio && lru.hitRatio >= lfu.hitRatio) {
    patternInsight = `LRU performed better on this sequence, which is consistent with temporal locality: recently requested keys were useful again before they were evicted.`;
  } else if (lfu.hitRatio > lru.hitRatio && lfu.hitRatio > fifo.hitRatio) {
    patternInsight = `LFU performed best on this sequence, which is consistent with frequency skew: repeated requests to popular keys rewarded retaining frequently used items.`;
  } else {
    patternInsight = `The measured results differ across policies for this sequence. Compare the request order and each policy's eviction rule to understand why the hit ratios differ.`;
  }

  const preview = requestSequencePreview.length
    ? requestSequencePreview.join(', ')
    : 'sequence preview unavailable';

  return `### Performance Summary
${outcomeSummary}

- **LRU (Least Recently Used):** ${(lru.hitRatio * 100).toFixed(2)}% hit ratio — ${lru.hits} hits, ${lru.misses} misses, ${lru.evictions} evictions.
- **LFU (Least Frequently Used):** ${(lfu.hitRatio * 100).toFixed(2)}% hit ratio — ${lfu.hits} hits, ${lfu.misses} misses, ${lfu.evictions} evictions.
- **FIFO (First-In, First-Out):** ${(fifo.hitRatio * 100).toFixed(2)}% hit ratio — ${fifo.hits} hits, ${fifo.misses} misses, ${fifo.evictions} evictions.

### Workload Access Pattern Analysis
${patternInsight}

The backend evaluated **${requestCount} requests** with a cache capacity of **${capacity} entries**. The sequence preview is: ${preview}. These are synthetic benchmark results, not a prediction of production traffic.

- **Temporal locality** means recently accessed keys are requested again soon.
- **Frequency skew** means a small number of keys receive a large share of requests.
- **Cache thrashing** can occur when a repeating working set is larger than the cache and keys are repeatedly evicted before their next use.

### Engineering & Algorithmic Trade-offs
- **FIFO:** Evicts the oldest inserted entry. It is simple and does not reorder entries on a cache hit, but can evict a frequently used key.
- **LRU:** Evicts the least recently used entry. It works well when recent accesses predict future requests, but cache hits update recency state.
- **LFU:** Evicts a least-frequently used entry. It can preserve popular keys, but old popularity can become stale unless frequency aging is implemented.

The best policy depends on the request distribution. A small difference in this synthetic run should not be treated as a universal ranking.

### Recommended Next Workload
Keep the same request sequence and set cache capacity to **3** for a four-key cycle: `A, B, C, D, A, B, C, D, A, B, C, D`. Because the loop contains four distinct keys but the cache holds only three, each policy should miss on every request for this repeating order. Expected result: **0 hits, 12 misses, 0.00% hit ratio** for FIFO, LRU, and LFU.`;
}

/**
 * Generate AI/LLM insights for a benchmark result.
 */
export async function generateBenchmarkInsights(benchmarkData) {
  const prompt = buildBenchmarkPrompt(benchmarkData);
  const llmResult = await requestLlmCompletion(prompt);

  // Do not show truncated Gemini/OpenAI text. A complete deterministic explanation
  // is more useful than a provider badge attached to unfinished prose.
  if (llmResult && isCompleteExplanation(llmResult.content)) {
    return {
      explanation: llmResult.content,
      source: 'llm-provider',
      provider: llmResult.provider,
    };
  }

  return {
    explanation: generateDeterministicAnalysis(benchmarkData),
    source: 'educational-fallback',
    provider: 'Educational fallback',
  };
}
