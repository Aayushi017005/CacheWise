import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LruCache } from '../../src/algorithms/lruCache.js';

describe('LruCache', () => {
  it('should store and retrieve values correctly', () => {
    const cache = new LruCache(3);
    cache.set('a', 1);
    cache.set('b', 2);

    assert.equal(cache.get('a'), 1);
    assert.equal(cache.get('b'), 2);
    assert.equal(cache.get('c'), null);
    assert.equal(cache.size(), 2);
  });

  it('should evict the least recently used item on capacity overflow', () => {
    const cache = new LruCache(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);

    // Reading 'a' promotes 'a' to MRU. Order now: 'a' (MRU), 'c', 'b' (LRU)
    cache.get('a');

    // Adding 'd' should evict 'b' (the least recently used)
    const result = cache.set('d', 4);
    assert.equal(result.evictedKey, 'b');
    assert.equal(cache.get('b'), null);
    assert.equal(cache.get('a'), 1);
    assert.equal(cache.get('c'), 3);
    assert.equal(cache.get('d'), 4);
  });

  it('should promote an item to MRU when updated via set', () => {
    const cache = new LruCache(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);

    // Update 'a'. Order now: 'a' (MRU), 'c', 'b' (LRU)
    cache.set('a', 100);

    // Adding 'd' should evict 'b'
    const result = cache.set('d', 4);
    assert.equal(result.evictedKey, 'b');
    assert.equal(cache.get('b'), null);
    assert.equal(cache.get('a'), 100);
  });

  it('should expire keys based on TTL', async () => {
    const cache = new LruCache(2);
    cache.set('temp', 42, 30);

    assert.equal(cache.get('temp'), 42);

    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.equal(cache.get('temp'), null);
    assert.equal(cache.size(), 0);
  });

  it('should handle capacity of 1 properly', () => {
    const cache = new LruCache(1);
    cache.set('first', 1);
    assert.equal(cache.get('first'), 1);

    const result = cache.set('second', 2);
    assert.equal(result.evictedKey, 'first');
    assert.equal(cache.get('first'), null);
    assert.equal(cache.get('second'), 2);
  });

  it('should delete and clear entries', () => {
    const cache = new LruCache(3);
    cache.set('k1', 'v1');
    cache.set('k2', 'v2');

    assert.equal(cache.delete('k1'), true);
    assert.equal(cache.delete('k1'), false);
    assert.equal(cache.size(), 1);

    cache.clear();
    assert.equal(cache.size(), 0);
    assert.equal(cache.get('k2'), null);
  });

  it('should throw when constructed with invalid capacity', () => {
    assert.throws(() => new LruCache(0), /Invalid cache capacity/);
    assert.throws(() => new LruCache(-1), /Invalid cache capacity/);
  });
});

