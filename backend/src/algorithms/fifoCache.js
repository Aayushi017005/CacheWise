/**
 * Doubly Linked List Node for FIFO Cache
 */
class FifoNode {
  constructor(key, value, expiresAt = null) {
    this.key = key;
    this.value = value;
    this.expiresAt = expiresAt;
    this.prev = null;
    this.next = null;
  }
}

/**
 * First-In-First-Out (FIFO) Cache Implementation
 *
 * Characteristics:
 * - Evicts the oldest inserted item when capacity is reached.
 * - Cache hits (reads) do NOT update the eviction order.
 * - Updates to existing keys do NOT change insertion order.
 *
 * Data Structures:
 * - Hash Map (Map): O(1) key-to-node lookup.
 * - Doubly Linked List: O(1) node insertion at tail, eviction from head.
 *
 * Complexity:
 * - Time: O(1) for get, set, delete, clear, size.
 * - Space: O(C) where C is the maximum capacity.
 */
export class FifoCache {
  constructor(capacity = 100, defaultTtlMs = null) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new Error(`Invalid cache capacity: ${capacity}. Must be a positive integer.`);
    }
    this.capacity = capacity;
    this.defaultTtlMs = defaultTtlMs;
    this.map = new Map();

    // Sentinel dummy nodes to eliminate boundary null checks
    this.head = new FifoNode(null, null);
    this.tail = new FifoNode(null, null);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  /**
   * Helper to attach node right before tail (newest inserted)
   */
  _insertAtTail(node) {
    node.prev = this.tail.prev;
    node.next = this.tail;
    this.tail.prev.next = node;
    this.tail.prev = node;
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
   * Check if a node is expired
   */
  _isExpired(node) {
    return node.expiresAt !== null && Date.now() > node.expiresAt;
  }

  /**
   * Retrieve an item by key
   * Returns value if present and unexpired; otherwise null.
   * Does NOT alter eviction order.
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

    return node.value;
  }

  /**
   * Store or update a key-value pair with optional TTL.
   * If capacity is exceeded, evicts the oldest node from head.
   * Returns { evictedKey: string | null }
   */
  set(key, value, ttlMs = this.defaultTtlMs) {
    const expiresAt = ttlMs !== null && ttlMs > 0 ? Date.now() + ttlMs : null;
    let evictedKey = null;

    if (this.map.has(key)) {
      // Key already exists: update in place without altering FIFO order
      const existing = this.map.get(key);
      existing.value = value;
      existing.expiresAt = expiresAt;
      return { evictedKey: null };
    }

    // New key: check if eviction is necessary
    if (this.map.size >= this.capacity) {
      evictedKey = this._evictOldest();
    }

    const newNode = new FifoNode(key, value, expiresAt);
    this._insertAtTail(newNode);
    this.map.set(key, newNode);

    return { evictedKey };
  }

  /**
   * Evict the oldest node (head.next)
   */
  _evictOldest() {
    const oldest = this.head.next;
    if (oldest === this.tail) {
      return null;
    }
    const key = oldest.key;
    this._removeNode(oldest);
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
   * Diagnostic helper to inspect keys in insertion order (oldest to newest)
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

