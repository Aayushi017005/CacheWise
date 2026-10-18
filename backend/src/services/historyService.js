import { BenchmarkHistory } from '../models/BenchmarkHistory.js';
import { isDatabaseConnected } from '../config/database.js';

// Resilient in-memory storage when MongoDB is not connected
const inMemoryHistory = [];

export class HistoryService {
  /**
   * Save a completed benchmark result
   */
  async saveBenchmark(data) {
    const payload = {
      name: data.name || 'Workload Run',
      capacity: Number(data.capacity),
      ttlMs: data.ttlMs !== undefined && data.ttlMs !== null ? Number(data.ttlMs) : null,
      requestCount: data.requestCount || (data.requests ? data.requests.length : 0),
      requestSequence: Array.isArray(data.requests) ? data.requests.slice(0, 1000) : [],
      bestStrategy: data.bestStrategy || 'LRU',
      results: data.results,
      aiInsights: data.aiInsights || null,
      createdAt: new Date(),
    };

    if (isDatabaseConnected()) {
      const doc = new BenchmarkHistory(payload);
      return await doc.save();
    }

    // In-memory fallback
    const memRecord = {
      _id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...payload,
    };
    inMemoryHistory.unshift(memRecord);
    return memRecord;
  }

  /**
   * Retrieve saved benchmark history runs
   */
  async listBenchmarks(limit = 50) {
    if (isDatabaseConnected()) {
      return await BenchmarkHistory.find()
        .sort({ createdAt: -1 })
        .limit(Math.min(limit, 100))
        .lean();
    }

    return inMemoryHistory.slice(0, limit);
  }

  /**
   * Retrieve a single benchmark run by ID
   */
  async getBenchmarkById(id) {
    if (isDatabaseConnected()) {
      return await BenchmarkHistory.findById(id).lean();
    }

    return inMemoryHistory.find((item) => String(item._id) === String(id)) || null;
  }

  /**
   * Delete a benchmark run by ID
   */
  async deleteBenchmarkById(id) {
    if (isDatabaseConnected()) {
      const result = await BenchmarkHistory.findByIdAndDelete(id);
      return result !== null;
    }

    const index = inMemoryHistory.findIndex((item) => String(item._id) === String(id));
    if (index !== -1) {
      inMemoryHistory.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Update AI insights for an existing benchmark run
   */
  async updateAiInsights(id, insights) {
    if (isDatabaseConnected()) {
      return await BenchmarkHistory.findByIdAndUpdate(
        id,
        { $set: { aiInsights: insights } },
        { new: true }
      ).lean();
    }

    const record = inMemoryHistory.find((item) => String(item._id) === String(id));
    if (record) {
      record.aiInsights = insights;
      return record;
    }
    return null;
  }

  /**
   * Clear in-memory history (useful for tests)
   */
  clearInMemory() {
    inMemoryHistory.length = 0;
  }
}

export const historyService = new HistoryService();

