import React, { useState, useEffect } from 'react';
import { api } from '../services/backendApi.js';
import { MetricCard } from '../components/MetricCard.jsx';
import { CacheControls } from '../components/CacheControls.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { ErrorMessage } from '../components/ErrorMessage.jsx';
import {
  Activity,
  CheckCircle,
  XCircle,
  Zap,
  Clock,
  Layers,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Demo Endpoint state
  const [selectedProductId, setSelectedProductId] = useState('1');
  const [simulatedDelay, setSimulatedDelay] = useState(120);
  const [demoResponse, setDemoResponse] = useState(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoHistory, setDemoHistory] = useState([]);

  const loadStats = async () => {
    try {
      const data = await api.getCacheStats();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    // Poll stats periodically for live dashboard updates
    const interval = setInterval(loadStats, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateConfig = async (newConfig) => {
    await api.updateCacheConfig(newConfig);
    await loadStats();
  };

  const handleClearCache = async () => {
    await api.clearCache();
    await loadStats();
    setDemoResponse(null);
    setDemoHistory([]);
  };

  const triggerDemoRequest = async () => {
    setDemoLoading(true);
    try {
      const result = await api.fetchDemoProduct(selectedProductId, simulatedDelay);
      setDemoResponse(result);
      setDemoHistory((prev) => [
        {
          id: selectedProductId,
          cacheStatus: result.cacheStatus,
          responseTime: result.responseTime,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 9),
      ]);
      await loadStats();
    } catch (err) {
      alert(`Demo request failed: ${err.message}`);
    } finally {
      setDemoLoading(false);
    }
  };

  if (loading && !stats) {
    return <LoadingState message="Connecting to CacheWise backend..." />;
  }

  const metrics = stats?.metrics || {};
  const currentConfig = stats?.config || {};

  return (
    <div className="space-y-6">
      {error && <ErrorMessage title="Failed to fetch cache stats" message={error} onRetry={loadStats} />}

      {/* Hero / Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/40 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                Active Strategy: {currentConfig.strategy}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Capacity: {stats?.size} / {currentConfig.capacity} entries
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 mt-2">API Caching Dashboard & Demo</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Monitor live cache performance and observe how in-memory caching reduces latency for real backend API requests.
            </p>
          </div>
          <button
            onClick={loadStats}
            className="flex items-center space-x-2 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors self-start md:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refresh Metrics</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Total Requests"
          value={metrics.totalRequests || 0}
          subtitle="Total API requests received"
          icon={Activity}
          color="blue"
        />
        <MetricCard
          title="Cache Hits"
          value={metrics.hits || 0}
          subtitle={`Average latency: ${metrics.avgHitLatencyMs || 0} ms`}
          icon={CheckCircle}
          color="emerald"
        />
        <MetricCard
          title="Cache Misses"
          value={metrics.misses || 0}
          subtitle={`Average latency: ${metrics.avgMissLatencyMs || 0} ms`}
          icon={XCircle}
          color="amber"
        />
        <MetricCard
          title="Hit Ratio"
          value={`${metrics.hitRatioPercentage || 0}%`}
          subtitle="Percentage of requests served from cache"
          icon={Zap}
          color="teal"
        />
        <MetricCard
          title="Evictions"
          value={metrics.evictions || 0}
          subtitle="Items evicted when capacity was reached"
          icon={Layers}
          color="rose"
        />
        <MetricCard
          title="Speedup Factor"
          value={
            metrics.avgHitLatencyMs > 0 && metrics.avgMissLatencyMs > 0
              ? `${(metrics.avgMissLatencyMs / metrics.avgHitLatencyMs).toFixed(0)}x`
              : 'N/A'
          }
          subtitle="Cache hit vs backend miss speedup"
          icon={Clock}
          color="purple"
        />
      </div>

      {/* Middle Row: Cache Controls + Interactive API Request Demo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cache Controls */}
        <div className="lg:col-span-5">
          <CacheControls
            currentConfig={currentConfig}
            onUpdateConfig={handleUpdateConfig}
            onClearCache={handleClearCache}
          />
        </div>

        {/* Live Demo Request Sandbox */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-teal-400" />
              <h3 className="text-base font-semibold text-slate-100">Interactive API Caching Demo</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
              GET /api/demo/products/:id
            </span>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Select Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                >
                  <option value="1">Product 1: Mechanical Keyboard ($99.99)</option>
                  <option value="2">Product 2: Wireless Ergonomic Mouse ($49.99)</option>
                  <option value="3">Product 3: 4K Ultra HD Monitor ($349.99)</option>
                  <option value="4">Product 4: Noise-Cancelling Headphones ($199.99)</option>
                  <option value="5">Product 5: USB-C Multiport Hub ($39.99)</option>
                  <option value="6">Product 6: Desk LED Lamp ($29.99)</option>
                  <option value="7">Product 7: Aluminium Laptop Stand ($34.99)</option>
                  <option value="8">Product 8: Webcam 1080p 60fps ($79.99)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Simulated Database Delay: <span className="font-mono text-teal-400">{simulatedDelay} ms</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="300"
                  step="20"
                  value={simulatedDelay}
                  onChange={(e) => setSimulatedDelay(Number(e.target.value))}
                  className="w-full accent-teal-500 mt-2"
                />
              </div>

              <div className="flex items-end space-x-2">
                <button
                  type="button"
                  onClick={triggerDemoRequest}
                  disabled={demoLoading}
                  className="w-full flex items-center justify-center space-x-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  <span>{demoLoading ? 'Fetching...' : demoResponse ? 'Send / Repeat Request' : 'Send Request'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Response Viewer */}
            {demoResponse ? (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800 text-[11px]">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">HTTP Status:</span>
                    <span className="text-emerald-400 font-bold">200 OK</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <span className="text-slate-400">Cache Result:</span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold uppercase ${
                          demoResponse.cacheStatus === 'HIT'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {demoResponse.cacheStatus}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-slate-400">Response Time:</span>
                      <span className="text-teal-400 font-bold">{demoResponse.responseTime}</span>
                    </div>
                  </div>
                </div>

                <div className="text-slate-400 text-[11px] mb-2">
                  Cache Key: <span className="text-slate-300">{demoResponse.cacheKey}</span>
                </div>

                <pre className="text-slate-300 overflow-x-auto p-2 bg-slate-900/50 rounded">
                  {JSON.stringify(demoResponse.product, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="border border-dashed border-slate-800 rounded-lg p-6 text-center text-slate-400 text-xs leading-relaxed">
                Select a product and click "Send Request" to fetch product data. The initial request queries the backend database (cache miss). Repeating the request retrieves the response directly from the in-memory cache (cache hit) with sub-millisecond response time.
              </div>
            )}

            {/* Quick Demo History Log */}
            {demoHistory.length > 0 && (
              <div>
                <h5 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Recent Request History
                </h5>
                <div className="space-y-1.5">
                  {demoHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3 py-1.5 bg-slate-950/60 rounded border border-slate-800/80 text-[11px] font-mono"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-300">Product {item.id}</span>
                        <span className="text-slate-500 text-[10px]">{item.timestamp}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            item.cacheStatus === 'HIT'
                              ? 'text-emerald-400 bg-emerald-500/10'
                              : 'text-amber-400 bg-amber-500/10'
                          }`}
                        >
                          {item.cacheStatus}
                        </span>
                        <span className="text-slate-300">{item.responseTime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

