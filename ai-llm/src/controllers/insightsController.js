import { generateBenchmarkInsights } from '../services/insightService.js';
import { validateBenchmarkData } from '../utils/validateBenchmark.js';

export async function explainBenchmark(req, res, next) {
  try {
    const validation = validateBenchmarkData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid benchmark data provided to AI service',
        details: validation.errors,
      });
    }

    const insights = await generateBenchmarkInsights(req.body);

    res.json({
      success: true,
      data: insights,
    });
  } catch (err) {
    next(err);
  }
}

