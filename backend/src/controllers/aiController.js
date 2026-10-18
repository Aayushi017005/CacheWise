import { fetchBenchmarkInsights } from '../services/aiClient.js';
import { historyService } from '../services/historyService.js';
import { validateBenchmarkPayload } from '../utils/validation.js';

export async function getBenchmarkInsights(req, res, next) {
  try {
    const { benchmark, benchmarkId } = req.body;

    if (!benchmark || !benchmark.results) {
      return res.status(400).json({
        error: 'A benchmark summary object with FIFO, LRU, and LFU results is required.',
      });
    }

    const insights = await fetchBenchmarkInsights(benchmark);

    // If an associated saved history record was provided, persist the AI explanation
    if (benchmarkId && insights.explanation) {
      await historyService.updateAiInsights(benchmarkId, insights.explanation);
    }

    res.json({
      success: true,
      data: insights,
    });
  } catch (err) {
    next(err);
  }
}

