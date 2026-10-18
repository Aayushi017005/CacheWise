import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../../src/app.js';
import { historyService } from '../../src/services/historyService.js';
import { cacheService } from '../../src/services/cacheService.js';

describe('API Integration & Persistence (with Resilient Fallback)', () => {
  beforeEach(() => {
    cacheService.clear();
    historyService.clearInMemory();
  });

  it('GET /api/health should return ok status and uptime', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.equal(res.body.service, 'CacheWise Backend');
  });

  it('GET /api/cache/stats should return cache status and metrics', async () => {
    const res = await request(app).get('/api/cache/stats');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(typeof res.body.data.config.strategy, 'string');
    assert.equal(typeof res.body.data.metrics.hitRatio, 'number');
  });

  it('PATCH /api/cache/config should update strategy and capacity', async () => {
    const res = await request(app)
      .patch('/api/cache/config')
      .send({ strategy: 'FIFO', capacity: 50 });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.strategy, 'FIFO');
    assert.equal(res.body.data.capacity, 50);

    // Reset back to LRU
    await request(app).patch('/api/cache/config').send({ strategy: 'LRU', capacity: 100 });
  });

  it('POST /api/benchmark should execute benchmark and return comparison', async () => {
    const res = await request(app)
      .post('/api/benchmark')
      .send({
        name: 'Integration Test Workload',
        capacity: 3,
        requests: ['A', 'B', 'C', 'A', 'D'],
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.results.FIFO);
    assert.ok(res.body.data.results.LRU);
    assert.ok(res.body.data.results.LFU);
  });

  it('POST /api/history and GET /api/history should store and retrieve benchmark runs', async () => {
    // 1. Run benchmark
    const benchRes = await request(app)
      .post('/api/benchmark')
      .send({
        name: 'History Test Workload',
        capacity: 2,
        requests: ['P1', 'P2', 'P1'],
      });

    // 2. Save benchmark to history
    const saveRes = await request(app)
      .post('/api/history')
      .send({
        name: benchRes.body.data.name,
        capacity: benchRes.body.data.capacity,
        requests: ['P1', 'P2', 'P1'],
        results: benchRes.body.data.results,
        bestStrategy: benchRes.body.data.bestStrategy,
      });

    assert.equal(saveRes.status, 201);
    assert.equal(saveRes.body.success, true);
    const savedId = saveRes.body.data._id;
    assert.ok(savedId);

    // 3. List history
    const listRes = await request(app).get('/api/history');
    assert.equal(listRes.status, 200);
    assert.equal(listRes.body.success, true);
    assert.ok(listRes.body.data.length >= 1);

    // 4. Get by ID
    const getRes = await request(app).get(`/api/history/${savedId}`);
    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.data._id, savedId);
    assert.equal(getRes.body.data.name, 'History Test Workload');

    // 5. Delete by ID
    const delRes = await request(app).delete(`/api/history/${savedId}`);
    assert.equal(delRes.status, 200);
    assert.equal(delRes.body.success, true);

    // 6. Confirm deletion
    const verifyRes = await request(app).get(`/api/history/${savedId}`);
    assert.equal(verifyRes.status, 404);
  });

  it('POST /api/ai/insights should handle AI service absence gracefully with fallback', async () => {
    const res = await request(app)
      .post('/api/ai/insights')
      .send({
        benchmark: {
          name: 'Fallback Test',
          capacity: 3,
          results: {
            FIFO: { hits: 1, misses: 2, evictions: 0, hitRatio: 0.33, executionTimeMs: 0.1 },
            LRU: { hits: 2, misses: 1, evictions: 0, hitRatio: 0.67, executionTimeMs: 0.1 },
            LFU: { hits: 2, misses: 1, evictions: 0, hitRatio: 0.67, executionTimeMs: 0.1 },
          },
        },
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.explanation);
    assert.ok(res.body.data.explanation.length > 20);
  });
});
