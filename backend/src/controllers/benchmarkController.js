import { runBenchmark } from '../services/benchmarkService.js';
import { validateBenchmarkPayload } from '../utils/validation.js';

export function executeBenchmark(req, res, next) {
  try {
    const validation = validateBenchmarkPayload(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid benchmark request parameters',
        details: validation.errors,
      });
    }

    const { name, capacity, ttlMs, requests } = req.body;
    const benchmarkResult = runBenchmark({
      name,
      capacity: Number(capacity),
      ttlMs: ttlMs !== undefined && ttlMs !== null ? Number(ttlMs) : null,
      requests,
    });

    res.json({
      success: true,
      data: benchmarkResult,
    });
  } catch (err) {
    next(err);
  }
}

