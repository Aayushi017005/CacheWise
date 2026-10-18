import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FifoCache } from '../../src/algorithms/fifoCache.js';

describe('FifoCache', () => {
  it('should store and retrieve values correctly', () => {
    const cache = new FifoCache(3);
    cache.set('a', 1);
    cache.set('b', 2);

    assert.equal(cache.get('a'), 1);
    assert.equal(cache.get('b'), 2);
    assert.equal(cache.get('c'), null);
    assert.equal(cache.size(), 2);
  });

  it('should evict the oldest inserted key when capacity is exceeded (FIFO order)', () => {
    const cache = new FifoCache(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);

    // Reading 'a' must NOT change insertion order in FIFO
    assert.equal(cache.get('a'), 1);

    // Inserting 'd' should evict 'a' (the first inserted)
    const result = cache.set('d', 4);
    assert.equal(result.evictedKey, 'a');
    assert.equal(cache.get('a'), null);
    assert.equal(cache.get('b'), 2);
    assert.equal(cache.get('c'), 3);
    assert.equal(cache.get('d'), 4);
  });

  it('should not change eviction order when updating an existing key', () => {
    const cache = new FifoCache(2);
    cache.set('a', 1);
    cache.set('b', 2);

    // Update 'a'
    cache.set('a', 99);
    assert.equal(cache.get('a'), 99);

    // Add 'c', 'a' was still inserted first so 'a' must be evicted
    const result = cache.set('c', 3);
    assert.equal(result.evictedKey, 'a');
    assert.equal(cache.get('a'), null);
    assert.equal(cache.get('b'), 2);
    assert.equal(cache.get('c'), 3);
  });

  it('should expire keys based on TTL', async () => {
    const cache = new FifoCache(3);
    cache.set('temp', 'value', 30); // 30ms TTL

    assert.equal(cache.get('temp'), 'value');

    // Wait 50ms for expiration
    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.equal(cache.get('temp'), null);
  });

  it('should handle capacity of 1', () => {
    const cache = new FifoCache(1);
    cache.set('x', 10);
    assert.equal(cache.get('x'), 10);

    const result = cache.set('y', 20);
    assert.equal(result.evictedKey, 'x');
    assert.equal(cache.get('x'), null);
    assert.equal(cache.get('y'), 20);
  });

  it('should correctly delete keys and clear all entries', () => {
    const cache = new FifoCache(3);
    cache.set('k1', 1);
    cache.set('k2', 2);

    assert.equal(cache.delete('k1'), true);
    assert.equal(cache.delete('nonexistent'), false);
    assert.equal(cache.get('k1'), null);
    assert.equal(cache.size(), 1);

    cache.clear();
    assert.equal(cache.size(), 0);
    assert.equal(cache.get('k2'), null);
  });

  it('should throw when constructed with invalid capacity', () => {
    assert.throws(() => new FifoCache(0), /Invalid cache capacity/);
    assert.throws(() => new FifoCache(-5), /Invalid cache capacity/);
    assert.throws(() => new FifoCache('bad'), /Invalid cache capacity/);
  });
});

