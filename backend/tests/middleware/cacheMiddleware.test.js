import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../../src/app.js';
import { cacheService } from '../../src/services/cacheService.js';

describe('Cache Middleware & API Demo', () => {
  beforeEach(() => {
    cacheService.clear();
  });

  it('should return X-Cache: MISS on first request and X-Cache: HIT on second request', async () => {
    // First request -> MISS
    const res1 = await request(app).get('/api/demo/products/1?delay=0');
    assert.equal(res1.status, 200);
    assert.equal(res1.headers['x-cache'], 'MISS');
    assert.equal(res1.body.id, '1');

    // Second identical request -> HIT
    const res2 = await request(app).get('/api/demo/products/1?delay=0');
    assert.equal(res2.status, 200);
    assert.equal(res2.headers['x-cache'], 'HIT');
    assert.equal(res2.body.id, '1');
  });

  it('should NOT cache 404 error responses', async () => {
    const res1 = await request(app).get('/api/demo/products/999?delay=0');
    assert.equal(res1.status, 404);
    assert.equal(res1.headers['x-cache'], 'MISS');

    // Second request to nonexistent product must still be a MISS and 404
    const res2 = await request(app).get('/api/demo/products/999?delay=0');
    assert.equal(res2.status, 404);
    assert.equal(res2.headers['x-cache'], 'MISS');
  });

  it('should maintain strict cache-key separation for different query params or IDs', async () => {
    const resProduct1 = await request(app).get('/api/demo/products/1?delay=0');
    const resProduct2 = await request(app).get('/api/demo/products/2?delay=0');

    assert.equal(resProduct1.body.id, '1');
    assert.equal(resProduct2.body.id, '2');
    assert.notEqual(resProduct1.headers['x-cache-key'], resProduct2.headers['x-cache-key']);
  });

  it('should invalidate cache when DELETE /api/cache is invoked', async () => {
    // Cache product 1
    await request(app).get('/api/demo/products/1?delay=0');
    const hitRes = await request(app).get('/api/demo/products/1?delay=0');
    assert.equal(hitRes.headers['x-cache'], 'HIT');

    // Clear cache
    const clearRes = await request(app).delete('/api/cache');
    assert.equal(clearRes.status, 200);
    assert.equal(clearRes.body.success, true);

    // Next request must be MISS again
    const afterClearRes = await request(app).get('/api/demo/products/1?delay=0');
    assert.equal(afterClearRes.headers['x-cache'], 'MISS');
  });
});

