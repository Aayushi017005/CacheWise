import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LfuCache } from '../../src/algorithms/lfuCache.js';

describe('LfuCache', () => {
  it('should store and retrieve values correctly', () => {
    const cache = new LfuCache(3);
    cache.set('a', 1);
    cache.set('b', 2);

    assert.equal(cache.get('a'), 1);
    assert.equal(cache.get('b'), 2);
    assert.equal(cache.get('nonexistent'), null);
    assert.equal(cache.size(), 2);
  });

  it('should evict the least frequently accessed item', () => {
    const cache = new LfuCache(3);
    cache.set('a', 1); // freq 1
    cache.set('b', 2); // freq 1
    cache.set('c', 3); // freq 1

    // Access 'a' twice (freq -> 3)
    cache.get('a');
    cache.get('a');

    // Access 'b' once (freq -> 2)
    cache.get('b');

    // 'c' has freq 1 (the lowest). Adding 'd' must evict 'c'.
    const result = cache.set('d', 4);
    assert.equal(result.evictedKey, 'c');
    assert.equal(cache.get('c'), null);
    assert.equal(cache.get('a'), 1);
    assert.equal(cache.get('b'), 2);
    assert.equal(cache.get('d'), 4);
  });

  it('should use LRU as tie-breaker among items with the same frequency', () => {
    const cache = new LfuCache(3);
    cache.set('a', 1); // freq 1
    cache.set('b', 2); // freq 1
    cache.set('c', 3); // freq 1

    // Access 'a' once -> freq 2
    cache.get('a');
    // Access 'b' once -> freq 2
    cache.get('b');
    // Access 'c' once -> freq 2
    cache.get('c');

    // All 'a', 'b', 'c' now have freq = 2.
    // In freq bucket 2, the order of access was: 'a', then 'b', then 'c'.
    // Therefore 'a' is the least recently accessed with freq 2.
    // Adding 'd' should evict 'a'.
    const result = cache.set('d', 4);
    assert.equal(result.evictedKey, 'a');
    assert.equal(cache.get('a'), null);
    assert.equal(cache.get('b'), 2);
    assert.equal(cache.get('c'), 3);
    assert.equal(cache.get('d'), 4);
  });

  it('should handle capacity 1', () => {
    const cache = new LfuCache(1);
    cache.set('x', 10);
    cache.get('x'); // freq 2

    const result = cache.set('y', 20);
    assert.equal(result.evictedKey, 'x');
    assert.equal(cache.get('x'), null);
    assert.equal(cache.get('y'), 20);
  });

  it('should expire keys based on TTL', async () => {
    const cache = new LfuCache(2);
    cache.set('temp', 'data', 30);

    assert.equal(cache.get('temp'), 'data');

    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.equal(cache.get('temp'), null);
    assert.equal(cache.size(), 0);
  });

  it('should correctly delete and clear entries', () => {
    const cache = new LfuCache(3);
    cache.set('k1', 100);
    cache.set('k2', 200);

    assert.equal(cache.delete('k1'), true);
    assert.equal(cache.delete('nonexistent'), false);
    assert.equal(cache.get('k1'), null);
    assert.equal(cache.size(), 1);

    cache.clear();
    assert.equal(cache.size(), 0);
    assert.equal(cache.get('k2'), null);
  });

  it('should throw when constructed with invalid capacity', () => {
    assert.throws(() => new LfuCache(0), /Invalid cache capacity/);
    assert.throws(() => new LfuCache(-3), /Invalid cache capacity/);
  });
});

