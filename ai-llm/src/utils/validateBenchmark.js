/**
 * Validate incoming benchmark data received by the AI service
 *
 * @param {object} payload
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateBenchmarkData(payload) {
  const errors = [];

  if (!payload || typeof payload !== 'object') {
    return { isValid: false, errors: ['Payload must be a valid JSON object.'] };
  }

  const { capacity, results } = payload;

  if (capacity === undefined || Number(capacity) < 1) {
    errors.push('Benchmark capacity must be a positive number.');
  }

  if (!results || typeof results !== 'object') {
    errors.push('Benchmark results object is missing.');
  } else {
    for (const strat of ['FIFO', 'LRU', 'LFU']) {
      if (!results[strat]) {
        errors.push(`Missing benchmark result for strategy: ${strat}`);
      } else {
        const item = results[strat];
        if (typeof item.hits !== 'number' || typeof item.misses !== 'number' || typeof item.hitRatio !== 'number') {
          errors.push(`Strategy ${strat} must contain numeric hits, misses, and hitRatio.`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

