# CacheWise: API Caching Middleware & Cache Algorithm Benchmarking Platform

> An educational, SDE-focused backend engineering, Data Structures & Algorithms (DSA), and AI-augmented developer tool built to demonstrate how in-memory caching systems operate in modern production architectures.

---

## 1. Problem Statement & Purpose

In modern distributed backend systems, databases and external microservices are frequently the primary bottleneck. Network I/O and disk access introduce latencies ranging from tens to hundreds of milliseconds. Caching layers are placed in front of data stores to serve repeated reads in sub-millisecond time.

However, selecting an eviction policy is rarely straightforward:
- **FIFO (First-In, First-Out)** is simple with zero pointer manipulation on cache hits, but ignores recency and frequency, leading to suboptimal hit ratios and risks like *Belady's Anomaly*.
- **LRU (Least Recently Used)** captures temporal locality (items accessed recently are likely to be accessed again), but updates linked-list pointers on every read hit, which introduces write contention under high multithreaded concurrency.
- **LFU (Least Frequently Used)** protects consistently popular keys regardless of when they were last accessed, but can suffer from *cache pollution* when historical bursts never get evicted unless an aging mechanism is applied.

**CacheWise** demonstrates these exact principles by implementing:
1. **Real Express API Caching Middleware** that intercepts requests, tracks latency, sets `X-Cache: HIT / MISS` headers, and accelerates response times by up to **100x**.
2. **Deterministic O(1) Implementations from Scratch** of FIFO, LRU, and LFU using Hash Maps, Doubly Linked Lists, and Frequency Buckets with no third-party cache libraries.
3. **Multi-Strategy Benchmarking Engine** evaluating workloads across all three algorithms simultaneously under identical sequences.
4. **Resilient MongoDB Persistence** storing completed benchmark runs and configurations, with automatic in-memory fallback if MongoDB is offline.
5. **Decoupled AI/LLM Microservice** analyzing access patterns (temporal locality, frequency skew, cyclic thrashing) and explaining engineering trade-offs using Google Gemini / OpenAI with educational offline fallback.
6. **Developer Dashboard & Visualizer** built with React, Vite, Tailwind CSS, and Recharts.

---

## 2. Architecture Diagram & High-Level System Design

```
+-----------------------------------------------------------------------------------------+
|                                    REACT FRONTEND                                       |
|                                (Port 5173 - Vite + Tailwind)                            |
|                                                                                         |
|   +-----------------------+   +--------------------------+   +----------------------+   |
|   |  Live Dashboard &     |   |  Algorithm Benchmark     |   |  Benchmark History   |   |
|   |  API Request Demo     |   |  Engine & Recharts       |   |  & Saved Runs        |   |
|   +-----------+-----------+   +------------+-------------+   +----------+-----------+   |
+---------------|----------------------------|----------------------------|---------------+
                |                            |                            |
          REST HTTP API                REST HTTP API                REST HTTP API
                |                            |                            |
+---------------v----------------------------v----------------------------v---------------+
|                                    BACKEND SERVICE                                      |
|                                (Port 5000 - Express ES Modules)                         |
|                                                                                         |
|   +------------------------+   +-------------------------+   +----------------------+   |
|   |  API Caching           |   |  Benchmark Engine       |   |  History & Config    |   |
|   |  Middleware            |   |  (Isolated Simulators)  |   |  Service             |   |
|   +-----------+------------+   +------------+------------+   +----------+-----------+   |
|               |                             |                           |               |
|   +-----------v-----------------------------v-----------+               |               |
|   |       In-Memory Cache Implementations (From Scratch)  |               |               |
|   |       - FIFO (Map + Queue / Doubly Linked List)     |               |               |
|   |       - LRU  (Hash Map + Doubly Linked List)        |               |               |
|   |       - LFU  (Hash Map + Frequency Doubly Lists)    |               |               |
|   +-----------------------------------------------------+               |               |
+--------------------------------------------|----------------------------|---------------+
                                             |                            |
                              Internal HTTP  |                            | Mongoose ORM
                             POST /internal  |                            | (or In-Memory Fallback)
                                             v                            v
               +-------------------------------------------+   +----------------------+
               |             AI/LLM MICROSERVICE           |   |       MONGODB        |
               |        (Port 5001 - Express ES Modules)   |   |    (Local / Atlas)   |
               |                                           |   |                      |
               |   +-----------------------------------+   |   | Collections:         |
               |   |  Prompt Orchestrator & Validator  |   |   | - BenchmarkHistory   |
               |   +-----------------+-----------------+   |   | - CacheConfiguration |
               |                     |                     |   +----------------------+
               |   +-----------------v-----------------+   |
               |   |  Provider Adapter                 |   |
               |   |  (Google Gemini / OpenAI / Rule)  |   |
               |   +-----------------------------------+   |
               +-------------------------------------------+
```

---

## 3. Strict Folder Separation & Responsibilities

The codebase enforces clean architectural boundaries:

```
CacheWise/
├── frontend/                     # React + Vite + Tailwind CSS + Recharts
│   ├── src/
│   │   ├── components/           # Reusable UI components (MetricCard, BenchmarkTable, etc.)
│   │   ├── pages/                # Dashboard, Benchmark, History
│   │   ├── services/             # backendApi.js (Single source of API calls)
│   │   ├── App.jsx               # Navigation tabs & health polling
│   │   ├── main.jsx              # React DOM entry
│   │   └── index.css             # Tailwind & typography styles
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
├── backend/                      # Node.js + Express ES Modules + Mongoose
│   ├── src/
│   │   ├── algorithms/           # FIFO, LRU, LFU from scratch & CacheFactory
│   │   ├── middleware/           # cacheMiddleware.js & errorHandler.js
│   │   ├── controllers/          # HTTP request/response handlers
│   │   ├── routes/               # Express route definitions
│   │   ├── services/             # Metrics, benchmark runner, DB history, AI client
│   │   ├── models/               # BenchmarkHistory.js & CacheConfiguration.js
│   │   ├── config/               # database.js & environment.js
│   │   ├── utils/                # cacheKey.js & validation.js
│   │   ├── app.js                # Express app setup
│   │   └── server.js             # HTTP server entry point
│   ├── tests/                    # Unit & integration tests (Node.js test runner)
│   ├── .env.example
│   └── package.json
│
├── ai-llm/                       # Node.js + Express AI explanation microservice
│   ├── src/
│   │   ├── controllers/          # insightsController.js
│   │   ├── routes/               # insightsRoutes.js
│   │   ├── services/             # llmService.js & insightService.js
│   │   ├── prompts/              # benchmarkExplanation.js
│   │   ├── utils/                # validateBenchmark.js
│   │   ├── config/               # environment.js
│   │   ├── app.js                # Internal Express app
│   │   └── server.js             # HTTP server entry point
│   ├── tests/                    # Unit tests for insight service & prompts
│   ├── .env.example
│   └── package.json
│
├── package.json                  # Workspace orchestration scripts
├── .gitignore
└── README.md
```

### Component Boundary Rules
1. **Frontend** contains **zero** caching algorithms, does not connect directly to MongoDB, and does not hold LLM API keys. It talks exclusively to `backend/` via REST APIs.
2. **Backend** executes cache algorithms strictly in-memory. It computes all benchmark metrics deterministically. It calls `ai-llm/` over HTTP for explanations and persists completed runs to MongoDB.
3. **AI-LLM** is an isolated microservice. It receives validated benchmark numbers and generates explanations. It does not calculate hit ratios, alter metrics, or access the database.

---

## 4. Cache Algorithms & Data Structure Design

All three algorithms share a consistent interface:
- `get(key)`: Retrieves value or `null`. Checks TTL expiration and handles order promotion.
- `set(key, value, ttlMs)`: Inserts or updates entry. Enforces capacity and evicts when full.
- `delete(key)`: Removes entry in $O(1)$.
- `clear()`: Empties cache in $O(1)$.
- `size()`: Returns current count in $O(1)$.

### A. FIFO (First-In, First-Out)
- **Data Structure**: Doubly Linked List + Hash Map (`Map<key, FifoNode>`).
- **Policy**: Evicts the oldest inserted item.
- **Key Invariant**: **Cache hits (reads) do NOT alter eviction order.** Updating an existing key modifies its value in place without resetting its position in the queue.
- **Time Complexity**:
  - `get(key)`: $O(1)$
  - `set(key, value)`: $O(1)$
  - `delete(key)`: $O(1)$
- **Space Complexity**: $O(C)$ where $C$ is maximum capacity.
- **Trade-off**: Immune to read-lock contention on cache hits, but risks *Belady's Anomaly* (where increasing capacity can paradoxically increase misses under certain patterns).

### B. LRU (Least Recently Used)
- **Data Structure**: Hash Map (`Map<key, LruNode>`) + Doubly Linked List with sentinel `head` (MRU) and `tail` (LRU) nodes.
- **Policy**: Evicts the item whose last access was furthest in the past.
- **Key Invariant**: Both `get(key)` (reads) and `set(key, value)` (updates) detach the node and re-insert it right behind the sentinel `head` (marking it Most Recently Used).
- **Time Complexity**:
  - `get(key)`: $O(1)$
  - `set(key, value)`: $O(1)$
  - `delete(key)`: $O(1)$
- **Space Complexity**: $O(C)$ where $C$ is maximum capacity.
- **Trade-off**: Ideal for workloads exhibiting high temporal locality (e.g. web sessions, product lookups). In multithreaded systems, read hits mutate pointers, requiring synchronization.

### C. LFU (Least Frequently Used) with LRU Tie-Breaking
- **Data Structure**:
  1. `keyMap`: `Map<key, LfuNode>` for $O(1)$ key lookup.
  2. `freqMap`: `Map<frequency, FrequencyList>` where each `FrequencyList` is a Doubly Linked List representing items with identical access counts.
  3. `minFreq`: Integer tracking the lowest frequency currently present in the cache.
- **Policy**: Evicts the item with the lowest access count. If multiple keys share `minFreq`, the **least recently used (tail of the minFreq list)** is evicted deterministically.
- **Time Complexity**:
  - `get(key)`: $O(1)$ average and worst case.
  - `set(key, value)`: $O(1)$ average and worst case.
  - `delete(key)`: $O(1)$.
- **Space Complexity**: $O(C)$ where $C$ is maximum capacity.
- **Trade-off**: Retains consistently popular items indefinitely. Vulnerable to historical frequency pollution unless paired with decay/aging.

### Summary Comparison Table

| Metric | FIFO | LRU | LFU |
|---|---|---|---|
| **Lookup Time** | $O(1)$ | $O(1)$ | $O(1)$ |
| **Insertion Time** | $O(1)$ | $O(1)$ | $O(1)$ |
| **Eviction Time** | $O(1)$ | $O(1)$ | $O(1)$ |
| **Eviction Criterion** | Arrival Timestamp | Recency of Access | Access Frequency (Tie-break: LRU) |
| **Hit Contention** | Low (read-only) | High (mutates MRU pointers) | High (mutates frequency buckets) |
| **Primary Weakness** | Belady's Anomaly | Cache pollution on loop scans | Stale high-frequency items |

---

## 5. API Caching Middleware Flow

The backend middleware (`backend/src/middleware/cacheMiddleware.js`) transparently accelerates GET routes:

```
Incoming GET Request
        │
        ▼
Generate Normalized Cache Key
(Method + Normalized Path + Sorted Query Params)
Example: "GET:/api/demo/products/1?delay=120"
        │
        ├──► Valid in-memory cache hit?
        │       ├── YES:
        │       │    - Set X-Cache: HIT
        │       │    - Set X-Response-Time: <latency>ms
        │       │    - Record hit in metricsService
        │       │    - Return cached JSON response (~0.5ms)
        │       │
        │       └── NO (Cache Miss):
        │            - Set X-Cache: MISS
        │            - Forward to controller handler
        │            - Execute simulated DB query (~120ms)
        │            - Intercept res.json():
        │                 - If HTTP status is 2xx, store in cacheService.set(key, body)
        │                 - Set X-Response-Time: <latency>ms
        │                 - Record miss in metricsService
        │            - Return response to client
```

### Safety Rules
- **GET Only**: POST, PUT, PATCH, and DELETE bypass cache middleware.
- **2xx Status Codes Only**: 404, 500, or other error responses are never cached.
- **Deterministic Keys**: Query parameters are sorted alphabetically (`?a=1&b=2` and `?b=2&a=1` map to the identical cache entry).

---

## 6. MongoDB Persistence & Resilient Fallback

MongoDB is used for **persistent application history**, **NOT** as the active cache store.

### Why MongoDB is Not Used as the Cache
In production systems, MongoDB writes to disk/wiredTiger journal and traverses B-Trees with network latency. An in-memory cache operates in RAM with $O(1)$ pointers and sub-microsecond latency. Using MongoDB as the cache would defeat the core purpose of caching.

### Mongoose Schemas

#### A. BenchmarkHistory
```javascript
{
  name: { type: String, maxlength: 100 },
  capacity: { type: Number, required: true, min: 1 },
  ttlMs: { type: Number, default: null },
  requestCount: { type: Number, required: true },
  requestSequence: { type: [String], maxlength: 1000 },
  bestStrategy: { type: String, enum: ['FIFO', 'LRU', 'LFU'], required: true },
  results: {
    FIFO: StrategyResultSchema,
    LRU: StrategyResultSchema,
    LFU: StrategyResultSchema
  },
  aiInsights: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
}
```

#### B. CacheConfiguration
```javascript
{
  name: { type: String, required: true, unique: true },
  strategy: { type: String, enum: ['FIFO', 'LRU', 'LFU'], required: true },
  capacity: { type: Number, required: true, min: 1, max: 100000 },
  ttlMs: { type: Number, default: 60000, min: 0 },
  timestamps: true
}
```

### Graceful In-Memory Fallback
If MongoDB is not running or credentials are not supplied:
- `connectDatabase()` catches the connection error with a clear warning log.
- `historyService` automatically switches to an internal in-memory array storage.
- All benchmark saving, listing, retrieval, and deletion operations continue working seamlessly without crashing.

---

## 7. AI/LLM Microservice & Integration

The AI microservice (`ai-llm/`) is completely decoupled from the backend and frontend.

### Request Flow
1. User clicks **"Explain with AI"** on the Benchmark tab.
2. Frontend sends `POST /api/ai/insights` to the Backend with the benchmark results.
3. Backend forwards the validated summary over internal HTTP to `POST http://localhost:5001/internal/insights`.
4. AI service validates the input and attempts to call the configured LLM provider (**Google Gemini** or **OpenAI**) using native `fetch` with an `AbortController` timeout (`8000ms`).
5. **No API Key / Offline Fallback**: If no API key is configured or the provider times out, the service automatically invokes its **built-in educational reasoning engine**, generating an in-depth 4-section architectural breakdown analyzing the exact numbers, access distribution, and Big-O trade-offs.
6. The explanation is returned to the backend, optionally persisted to MongoDB, and rendered in the React dashboard.

---

## 8. API Endpoint Reference

### Backend Endpoints (`http://localhost:5000`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check, uptime, and status |
| `GET` | `/api/cache/stats` | Live cache size, active strategy, hits, misses, hit ratio, and latency |
| `PATCH` | `/api/cache/config` | Dynamically update active strategy (`FIFO`/`LRU`/`LFU`), capacity, or TTL |
| `DELETE` | `/api/cache` | Invalidate all entries and reset live metrics |
| `GET` | `/api/demo/products` | Cached product catalog |
| `GET` | `/api/demo/products/:id` | Cached product endpoint with `X-Cache: HIT/MISS` headers |
| `POST` | `/api/benchmark` | Run identical workload through FIFO, LRU, and LFU in backend memory |
| `POST` | `/api/history` | Persist completed benchmark run to MongoDB (or in-memory store) |
| `GET` | `/api/history` | List saved benchmark history runs |
| `GET` | `/api/history/:id` | Retrieve single benchmark run by ID |
| `DELETE` | `/api/history/:id` | Delete saved benchmark run |
| `POST` | `/api/ai/insights` | Request AI architectural explanation for a benchmark result |

### AI/LLM Microservice Endpoints (`http://localhost:5001`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/internal/health` | Service health and configured LLM provider status |
| `POST` | `/internal/insights` | Receive benchmark summary, return 4-part architectural analysis |

---

## 9. Environment Variable Setup

### Backend (`backend/.env`)
```bash
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/cachewise
AI_SERVICE_URL=http://localhost:5001
DEFAULT_CACHE_STRATEGY=LRU
DEFAULT_CACHE_CAPACITY=100
DEFAULT_CACHE_TTL_MS=60000
```

### AI/LLM Service (`ai-llm/.env`)
```bash
PORT=5001
NODE_ENV=development

# LLM Provider: "gemini" or "openai"
LLM_PROVIDER=gemini

# Google Gemini API Key (Leave empty to use built-in educational engine)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash

# Optional OpenAI Configuration
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

LLM_TIMEOUT_MS=8000
```

### Frontend (`frontend/.env`)
```bash
VITE_BACKEND_URL=http://localhost:5000
```

---

## 10. Installation & Startup Commands

### Step 1: Install Dependencies
From the repository root:
```bash
npm run install:all
```
*(Or run `npm install` inside each of `backend/`, `ai-llm/`, and `frontend/` separately).*

### Step 2: Start the Services
Run each service in its own terminal window:

**Terminal 1 — Backend (Port 5000):**
```bash
npm run dev:backend
```

**Terminal 2 — AI/LLM Service (Port 5001):**
```bash
npm run dev:ai
```

**Terminal 3 — React Frontend (Port 5173):**
```bash
npm run dev:frontend
```

Open `http://localhost:5173` in your browser.

---

## 11. Automated Testing

All unit and integration tests use Node.js built-in `node:test` runner. **Tests run offline without requiring MongoDB or external internet connections.**

### Run All Tests:
```bash
npm test
```

### Run Backend Tests Only:
```bash
npm run test:backend
```
*Coverage includes:*
- FIFO insertion-order and update-order invariants.
- LRU access-order promotion and tail eviction.
- LFU frequency incrementing and deterministic LRU tie-breaking.
- TTL expiration and edge case handling (capacity 1, empty cache, invalid capacity).
- Middleware `X-Cache: HIT` and `MISS` header issuance.
- Cache-key parameter separation.
- Non-caching of 404/500 HTTP errors.
- Hand-calculated benchmark verification (`A, B, A, C, D, A, B` with capacity 3).
- Resilient operation when MongoDB is offline.
- Graceful fallback when AI microservice is offline.

### Run AI Microservice Tests Only:
```bash
npm run test:ai
```
*Coverage includes:*
- Benchmark payload validation and error rejection.
- Structured 4-section prompt construction.
- Educational deterministic explanation generation.

---

## 12. Benchmark Methodology & Presets

To systematically compare algorithms, CacheWise provides 4 reproducible benchmark presets:

1. **Hand-Calculated Reference**:
   - Sequence: `A, B, A, C, D, A, B` | Capacity: `3`
   - Outcome: **LRU & LFU Win (28.57% Hit Ratio)** vs **FIFO (14.29% Hit Ratio)**.
   - Mechanism: Reading `A` at step 3 refreshes `A` in LRU, preventing its eviction at step 5. In FIFO, `A` is evicted because it arrived first.

2. **Temporal Locality (Recency Bursts)**:
   - Sequence: `A, B, C, A, A, B, D, A, B, C, A, B` | Capacity: `3`
   - Outcome: **LRU Wins**. Recent keys are repeatedly accessed before eviction.

3. **Frequency Skew (Pareto / Zipf)**:
   - Sequence: `A, A, A, B, B, C, D, A, A, B, E, A, B, F` | Capacity: `3`
   - Outcome: **LFU Wins**. Hot items `A` and `B` retain residency over transient single-use keys `C`, `D`, `E`, and `F`.

4. **Cyclic Loop (Cache Thrashing)**:
   - Sequence: `A, B, C, D, A, B, C, D, A, B, C, D` | Capacity: `3`
   - Outcome: **0% Hit Ratio for FIFO and LRU**. Every request is an eviction because the loop length (4) exceeds capacity (3).

---

## 13. Limitations & Future Improvements

- **Single-Node In-Memory**: CacheWise operates within a single Node.js process memory space. In distributed horizontal scaling, caches must either use sticky sessions or distributed systems like Redis.
- **LFU Aging**: Currently, LFU frequency counters never decay. In production, an exponential frequency decay or dynamic windowing algorithm (e.g. W-TinyLFU) prevents historical frequency pollution.
- **Cache Stampede / Dogpiling Protection**: Under extreme concurrency on a cold key, multiple requests may simultaneously fetch from the database. A probabilistic early expiration (XFetch) or mutex lock could be integrated.

---

## 14. License

MIT License. Developed for educational, interview preparation, and software engineering portfolio demonstration.

