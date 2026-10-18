import { historyService } from '../services/historyService.js';
import { isDatabaseConnected } from '../config/database.js';

export async function saveBenchmarkHistory(req, res, next) {
  try {
    const { name, capacity, ttlMs, requests, requestCount, results, bestStrategy, aiInsights } = req.body;

    if (!results || !results.FIFO || !results.LRU || !results.LFU) {
      return res.status(400).json({
        error: 'Invalid benchmark data: results for FIFO, LRU, and LFU are required.',
      });
    }

    const saved = await historyService.saveBenchmark({
      name,
      capacity,
      ttlMs,
      requests,
      requestCount,
      results,
      bestStrategy,
      aiInsights,
    });

    res.status(201).json({
      success: true,
      persistedToDb: isDatabaseConnected(),
      data: saved,
    });
  } catch (err) {
    next(err);
  }
}

export async function listBenchmarkHistory(req, res, next) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    const history = await historyService.listBenchmarks(limit);

    res.json({
      success: true,
      count: history.length,
      persistedToDb: isDatabaseConnected(),
      data: history,
    });
  } catch (err) {
    next(err);
  }
}

export async function getBenchmarkHistoryById(req, res, next) {
  try {
    const { id } = req.params;
    const item = await historyService.getBenchmarkById(id);

    if (!item) {
      return res.status(404).json({
        error: `Benchmark run with ID "${id}" was not found.`,
      });
    }

    res.json({
      success: true,
      data: item,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteBenchmarkHistoryById(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await historyService.deleteBenchmarkById(id);

    if (!deleted) {
      return res.status(404).json({
        error: `Benchmark run with ID "${id}" was not found.`,
      });
    }

    res.json({
      success: true,
      message: 'Benchmark record deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}

