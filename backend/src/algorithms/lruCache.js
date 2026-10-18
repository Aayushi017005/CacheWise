/**
 * Doubly Linked List Node for LRU Cache
 */
class LruNode {
  constructor(key, value, expiresAt = null) {
    this.key = key;
    this.value = value;
    this.expiresAt = expiresAt;
    this.prev = null;
    this.next = null;
  }
}

/**
 * Least Recently Used (LRU) Cache Implementation
 *
 * Characteristics:
 * - Evicts the least recently accessed item when capacity is reached.
 * - Cache hits (reads) and updates move the entry to the most recently used (MRU) position.
 *
 * Data Structures:
 * - Hash Map (Map): O(1) key-to-node lookup.
 * - Doubly Linked List: O(1) node relocation and eviction.
 *   - head.next = Most Recently Used (MRU)
 *   - tail.prev = Least Recently Used (LRU)
 *
 * Complexity:
 * - Time: O(1) for get, set, delete, clear, size.
 * - Space: O(C) where C is the maximum capacity.
 */
export class LruCache {
  constructor(capacity = 100, defaultTtlMs = null) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new Error(`Invalid cache capacity: ${capacity}. Must be a positive integer.`);
    }
    this.capacity = capacity;
    this.defaultTtlMs = defaultTtlMs;
    this.map = new Map();

    // Sentinel dummy nodes
    this.head = new LruNode(null, null); // MRU sentinel
    this.tail = new LruNode(null, null); // LRU sentinel
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  /**
   * Helper to detach node from its current position
   */
  _removeNode(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
    node.prev = null;
    node.next = null;
  }

  /**
   * Helper to attach node right after head (MRU)
   */
  _insertAtHead(node) {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next.prev = node;
    this.head.next = node;
  }

  /**
   * Move an existing node to the head (mark as most recently used)
   */
  _moveToHead(node) {
    this._removeNode(node);
    this._insertAtHead(node);
  }

  /**
   * Check if a node is expired
   */
  _isExpired(node) {
    return node.expiresAt !== null && Date.now() > node.expiresAt;
  }

  /**
   * Retrieve an item by key.
   * Promotes the entry to MRU position if unexpired.
   */
  get(key) {
    const node = this.map.get(key);
    if (!node) {
      return null;
    }

    if (this._isExpired(node)) {
      this.delete(key);
      return null;
    }

    this._moveToHead(node);
    return node.value;
  }

  /**
   * Store or update a key-value pair with optional TTL.
   * If capacity is exceeded, evicts the LRU node (tail.prev).
   * Returns { evictedKey: string | null }
   */
  set(key, value, ttlMs = this.defaultTtlMs) {
    const expiresAt = ttlMs !== null && ttlMs > 0 ? Date.now() + ttlMs : null;
    let evictedKey = null;

    if (this.map.has(key)) {
      const existing = this.map.get(key);
      existing.value = value;
      existing.expiresAt = expiresAt;
      this._moveToHead(existing);
      return { evictedKey: null };
    }

    if (this.map.size >= this.capacity) {
      evictedKey = this._evictLRU();
    }

    const newNode = new LruNode(key, value, expiresAt);
    this._insertAtHead(newNode);
    this.map.set(key, newNode);

    return { evictedKey };
  }

  /**
   * Evict the least recently used node (tail.prev)
   */
  _evictLRU() {
    const lru = this.tail.prev;
    if (lru === this.head) {
      return null;
    }
    const key = lru.key;
    this._removeNode(lru);
    this.map.delete(key);
    return key;
  }

  /**
   * Delete an item by key
   */
  delete(key) {
    const node = this.map.get(key);
    if (!node) {
      return false;
    }
    this._removeNode(node);
    this.map.delete(key);
    return true;
  }

  /**
   * Clear all entries
   */
  clear() {
    this.map.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  /**
   * Current number of stored entries
   */
  size() {
    return this.map.size;
  }

  /**
   * Diagnostic helper to inspect keys from MRU to LRU
   */
  keys() {
    const result = [];
    let curr = this.head.next;
    while (curr !== this.tail) {
      result.push(curr.key);
      curr = curr.next;
    }
    return result;
  }
}

