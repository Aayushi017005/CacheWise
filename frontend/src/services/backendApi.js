const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');

async function request(path, options = {}) {
  const url = `${BACKEND_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Extract cache and latency headers if present
  const cacheHeader = response.headers.get('x-cache');
  const responseTimeHeader = response.headers.get('x-response-time');
  const cacheKeyHeader = response.headers.get('x-cache-key');

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.details = data?.details;
    throw error;
  }

  return {
    data,
    headers: {
      cache: cacheHeader,
      responseTime: responseTimeHeader,
      cacheKey: cacheKeyHeader,
    },
  };
}

export const api = {
  // Health
  checkHealth: async () => {
    const res = await request('/api/health');
    return res.data;
  },

  // Cache Management
  getCacheStats: async () => {
    const res = await request('/api/cache/stats');
    return res.data.data;
  },

  updateCacheConfig: async ({ strategy, capacity, ttlMs }) => {
    const res = await request('/api/cache/config', {
      method: 'PATCH',
      body: JSON.stringify({ strategy, capacity, ttlMs }),
    });
    return res.data.data;
  },

  clearCache: async () => {
    const res = await request('/api/cache', { method: 'DELETE' });
    return res.data;
  },

  // Demo Endpoint (Response Caching)
  fetchDemoProduct: async (id, delayMs = 120) => {
    const res = await request(`/api/demo/products/${id}?delay=${delayMs}`);
    return {
      product: res.data,
      cacheStatus: res.headers.cache || 'NONE',
      responseTime: res.headers.responseTime || '0ms',
      cacheKey: res.headers.cacheKey,
    };
  },

  // Benchmarking
  runBenchmark: async ({ name, capacity, ttlMs, requests }) => {
    const res = await request('/api/benchmark', {
      method: 'POST',
      body: JSON.stringify({ name, capacity, ttlMs, requests }),
    });
    return res.data.data;
  },

  // Persistence (MongoDB / History)
  saveBenchmarkHistory: async (benchmarkData) => {
    const res = await request('/api/history', {
      method: 'POST',
      body: JSON.stringify(benchmarkData),
    });
    return res.data;
  },

  getBenchmarkHistory: async (limit = 50) => {
    const res = await request(`/api/history?limit=${limit}`);
    return res.data;
  },

  getBenchmarkById: async (id) => {
    const res = await request(`/api/history/${id}`);
    return res.data.data;
  },

  deleteBenchmarkHistory: async (id) => {
    const res = await request(`/api/history/${id}`, { method: 'DELETE' });
    return res.data;
  },

  // AI Insights
  getAiInsights: async (benchmark, benchmarkId = null) => {
    const res = await request('/api/ai/insights', {
      method: 'POST',
      body: JSON.stringify({ benchmark, benchmarkId }),
    });
    return res.data.data;
  },
};

