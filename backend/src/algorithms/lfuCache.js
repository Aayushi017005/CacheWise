/**
 * Doubly Linked List Node for LFU Cache
 */
class LfuNode {
  constructor(key, value, expiresAt = null) {
    this.key = key;
    this.value = value;
    this.expiresAt = expiresAt;
    this.freq = 1;
    this.prev = null;
    this.next = null;
  }
}

/**
 * Doubly Linked List bucket for a specific frequency in LFU
 */
class FrequencyList {
  constructor() {
    this.head = new LfuNode(null, null); // MRU for this frequency
    this.tail = new LfuNode(null, null); // LRU for this frequency
    this.head.next = this.tail;
    this.tail.prev = this.head;
    this.length = 0;
  }

  insertAtHead(node) {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next.prev = node;
    this.head.next = node;
    this.length++;
  }

  removeNode(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
    node.prev = null;
    node.next = null;
    this.length--;
  }

  removeTail() {
    if (this.length === 0) {
      return null;
    }
    const lruNode = this.tail.prev;
    this.removeNode(lruNode);
    return lruNode;
  }

  isEmpty() {
    return this.length === 0;
  }
}

/**
 * Least Frequently Used (LFU) Cache Implementation
 *
 * Characteristics:
 * - Evicts the entry with the lowest access count (frequency).
 * - Tie-breaker: If multiple entries share the lowest frequency, evicts the Least Recently Used (LRU) among them.
 * - Cache hits (reads) and updates increment the entry's frequency.
 *
 * Data Structures:
 * - keyMap: Map<key, LfuNode> for O(1) key lookups.
 * - freqMap: Map<frequency, FrequencyList> for O(1) access to frequency buckets.
 * - minFreq: Integer tracking the current lowest frequency in the cache.
 *
 * Complexity:
 * - Time: O(1) average/worst-case for get, set, delete, clear, size.
 * - Space: O(C) where C is the maximum capacity.
 */
export class LfuCache {
  constructor(capacity = 100, defaultTtlMs = null) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new Error(`Invalid cache capacity: ${capacity}. Must be a positive integer.`);
    }
    this.capacity = capacity;
    this.defaultTtlMs = defaultTtlMs;
    this.keyMap = new Map();
    this.freqMap = new Map();
    this.minFreq = 0;
  }

  /**
   * Check if a node is expired
   */
  _isExpired(node) {
    return node.expiresAt !== null && Date.now() > node.expiresAt;
  }

  /**
   * Move node to next higher frequency bucket
   */
  _updateFrequency(node) {
    const oldFreq = node.freq;
    const oldList = this.freqMap.get(oldFreq);

    if (oldList) {
      oldList.removeNode(node);
      if (oldList.isEmpty()) {
        this.freqMap.delete(oldFreq);
        if (this.minFreq === oldFreq) {
          this.minFreq = oldFreq + 1;
        }
      }
    }

    node.freq++;
    if (!this.freqMap.has(node.freq)) {
      this.freqMap.set(node.freq, new FrequencyList());
    }
    this.freqMap.get(node.freq).insertAtHead(node);
  }

  /**
   * Retrieve an item by key.
   * Increments the frequency and updates MRU position within the new frequency bucket.
   */
  get(key) {
    const node = this.keyMap.get(key);
    if (!node) {
      return null;
    }

    if (this._isExpired(node)) {
      this.delete(key);
      return null;
    }

    this._updateFrequency(node);
    return node.value;
  }

  /**
   * Store or update a key-value pair with optional TTL.
   * Evicts the LRU item from the minFreq bucket if capacity is reached.
   * Returns { evictedKey: string | null }
   */
  set(key, value, ttlMs = this.defaultTtlMs) {
    const expiresAt = ttlMs !== null && ttlMs > 0 ? Date.now() + ttlMs : null;
    let evictedKey = null;

    if (this.keyMap.has(key)) {
      const existing = this.keyMap.get(key);
      existing.value = value;
      existing.expiresAt = expiresAt;
      this._updateFrequency(existing);
      return { evictedKey: null };
    }

    if (this.keyMap.size >= this.capacity) {
      evictedKey = this._evictLFU();
    }

    const newNode = new LfuNode(key, value, expiresAt);
    newNode.freq = 1;
    this.minFreq = 1;

    if (!this.freqMap.has(1)) {
      this.freqMap.set(1, new FrequencyList());
    }
    this.freqMap.get(1).insertAtHead(newNode);
    this.keyMap.set(key, newNode);

    return { evictedKey };
  }

  /**
   * Evict the least frequently used node.
   * Uses LRU tie-breaker if multiple items share minFreq.
   */
  _evictLFU() {
    const minList = this.freqMap.get(this.minFreq);
    if (!minList || minList.isEmpty()) {
      return null;
    }

    const evictedNode = minList.removeTail();
    if (!evictedNode) {
      return null;
    }

    this.keyMap.delete(evictedNode.key);
    if (minList.isEmpty()) {
      this.freqMap.delete(this.minFreq);
    }

    return evictedNode.key;
  }

  /**
   * Delete an item by key
   */
  delete(key) {
    const node = this.keyMap.get(key);
    if (!node) {
      return false;
    }

    const list = this.freqMap.get(node.freq);
    if (list) {
      list.removeNode(node);
      if (list.isEmpty()) {
        this.freqMap.delete(node.freq);
      }
    }

    this.keyMap.delete(key);

    if (this.keyMap.size === 0) {
      this.minFreq = 0;
    }

    return true;
  }

  /**
   * Clear all entries
   */
  clear() {
    this.keyMap.clear();
    this.freqMap.clear();
    this.minFreq = 0;
  }

  /**
   * Current number of stored entries
   */
  size() {
    return this.keyMap.size;
  }

  /**
   * Diagnostic helper to inspect entries with their frequencies
   */
  getFrequencies() {
    const result = {};
    for (const [key, node] of this.keyMap.entries()) {
      result[key] = node.freq;
    }
    return result;
  }
}

