import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/backendApi.js';
import { MetricCard } from '../components/MetricCard.jsx';
import { CacheControls } from '../components/CacheControls.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { ErrorMessage } from '../components/ErrorMessage.jsx';
import {
  BarChart3,
  Database,
  Activity,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Zap,
  Clock,
  Layers,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Code2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';

export function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Manual Refresh Metrics state
  const refreshRequestIdRef = useRef(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState(null);
  const [refreshError, setRefreshError] = useState(null);

  // Demo Endpoint state
  const [selectedProductId, setSelectedProductId] = useState('1');
  const [simulatedDelay, setSimulatedDelay] = useState(120);
  const [demoResponse, setDemoResponse] = useState(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoHistory, setDemoHistory] = useState([]);
  const [showDevDiagnostics, setShowDevDiagnostics] = useState(false);

  // Saved benchmark summary is separate from live API-cache traffic metrics.
  const [benchmarkHistory, setBenchmarkHistory] = useState([]);
  const [benchmarkHistoryLoading, setBenchmarkHistoryLoading] = useState(true);
  const [benchmarkHistoryError, setBenchmarkHistoryError] = useState(null);
  const [benchmarkHistoryPersisted, setBenchmarkHistoryPersisted] = useState(false);

  const loadBenchmarkHistory = async () => {
    setBenchmarkHistoryLoading(true);
    try {
      const response = await api.getBenchmarkHistory(50);
      setBenchmarkHistory(Array.isArray(response.data) ? response.data : []);
      setBenchmarkHistoryPersisted(Boolean(response.persistedToDb));
      setBenchmarkHistoryError(null);
    } catch (err) {
      setBenchmarkHistoryError(err.message || 'Unable to load saved benchmark history.');
    } finally {
      setBenchmarkHistoryLoading(false);
    }
  };

  const loadStats = async (isManual = false) => {
    // Prevent duplicate concurrent requests when clicking Refresh Metrics
    if (isManual && isRefreshing) return;

    const currentRequestId = ++refreshRequestIdRef.current;

    if (isManual) {
      setIsRefreshing(true);
      setRefreshError(null);
      setRefreshMessage(null);
    }

    try {
      const data = await api.getCacheStats();

      // Guard against out-of-order stale responses
      if (currentRequestId === refreshRequestIdRef.current) {
        setStats(data);
        setError(null);
        if (isManual) {
          setRefreshMessage('Metrics updated');
          setTimeout(() => setRefreshMessage(null), 2500);
        }
      }
    } catch (err) {
      if (currentRequestId === refreshRequestIdRef.current) {
        if (isManual) {
          setRefreshError(err.message || 'Unable to refresh metrics. Please verify the backend is running.');
          setTimeout(() => setRefreshError(null), 4000);
        } else {
          setError(err.message);
        }
      }
    } finally {
      if (currentRequestId === refreshRequestIdRef.current) {
        setLoading(false);
        if (isManual) {
          setIsRefreshing(false);
        }
      }
    }
  };

  useEffect(() => {
    loadStats(false);
    // Background polling for live dashboard updates
    const interval = setInterval(() => loadStats(false), 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadBenchmarkHistory();
    // Refresh the saved benchmark summary periodically without changing live cache metrics.
    const interval = setInterval(() => loadBenchmarkHistory(), 15000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateConfig = async (newConfig) => {
    await api.updateCacheConfig(newConfig);
    await loadStats(false);
  };

  const handleClearCache = async () => {
    await api.clearCache();
    await loadStats(false);
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
      await loadStats(false);
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
      {error && <ErrorMessage title="Failed to fetch cache stats" message={error} onRetry={() => loadStats(true)} />}

      {/* Manual Refresh Feedback / Alert */}
      {refreshError && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{refreshError}</span>
          </div>
          <button
            type="button"
            onClick={() => setRefreshError(null)}
            className="text-amber-400 hover:text-amber-200 text-xs font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

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

          <div className="flex items-center space-x-2 self-start md:self-auto">
            {refreshMessage && (
              <span className="text-xs text-emerald-400 flex items-center space-x-1 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{refreshMessage}</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => loadStats(true)}
              disabled={isRefreshing}
              title="Fetch fresh cache metrics from backend"
              className={`flex items-center space-x-2 px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                isRefreshing
                  ? 'bg-slate-800/60 text-slate-400 border-slate-700/50 cursor-not-allowed'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 active:scale-95'
              }`}
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-teal-400' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Metrics'}</span>
            </button>
          </div>
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

      {/* Saved Benchmark Overview: sourced from the existing benchmark history API. */}
      <section className="space-y-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-400" />
              <h2 className="text-base font-semibold text-slate-100">Benchmark Overview</h2>
              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${benchmarkHistoryPersisted
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                {benchmarkHistoryPersisted ? 'MongoDB' : 'In-memory / unavailable'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Summary of saved FIFO, LRU and LFU benchmark runs. These figures are separate from the live API-cache metrics above.
            </p>
          </div>
          <button
            type="button"
            onClick={loadBenchmarkHistory}
            disabled={benchmarkHistoryLoading}
            className="flex items-center justify-center space-x-2 px-3 py-2 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${benchmarkHistoryLoading ? 'animate-spin' : ''}`} />
            <span>{benchmarkHistoryLoading ? 'Refreshing...' : 'Refresh Benchmark Data'}</span>
          </button>
        </div>

        {benchmarkHistoryError && (
          <ErrorMessage
            title="Failed to load benchmark history"
            message={benchmarkHistoryError}
            onRetry={loadBenchmarkHistory}
          />
        )}

        {(() => {
          const averageHitRatio = (strategy) => {
            const values = benchmarkHistory
              .map((run) => Number(run?.results?.[strategy]?.hitRatioPercentage))
              .filter((value) => Number.isFinite(value));
            if (values.length === 0) return '—';
            return `${(values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)}%`;
          };
          const totalRequestsTested = benchmarkHistory.reduce(
            (total, run) => total + (Number(run.requestCount) || 0),
            0
          );

          return (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <MetricCard
                  title="Saved Runs"
                  value={benchmarkHistory.length}
                  subtitle="Completed runs in history"
                  icon={Database}
                  color="blue"
                />
                <MetricCard
                  title="Requests Tested"
                  value={totalRequestsTested}
                  subtitle="Across saved benchmark runs"
                  icon={Activity}
                  color="purple"
                />
                <MetricCard
                  title="FIFO Avg. Hit Ratio"
                  value={averageHitRatio('FIFO')}
                  subtitle="Average across saved runs"
                  icon={Layers}
                  color="amber"
                />
                <MetricCard
                  title="LRU Avg. Hit Ratio"
                  value={averageHitRatio('LRU')}
                  subtitle="Average across saved runs"
                  icon={Zap}
                  color="teal"
                />
                <MetricCard
                  title="LFU Avg. Hit Ratio"
                  value={averageHitRatio('LFU')}
                  subtitle="Average across saved runs"
                  icon={Sparkles}
                  color="emerald"
                />
              </div>

              {benchmarkHistory.length === 0 && !benchmarkHistoryLoading ? (
                <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-xl p-8 text-center">
                  <Database className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <p className="text-sm font-medium text-slate-300">No saved benchmark runs yet</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Open Benchmark, execute a workload, and click “Save to History”. This overview will use those saved results.
                  </p>
                </div>
              ) : benchmarkHistory.length > 0 ? (
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-800">
                    <h3 className="text-sm font-semibold text-slate-100">Recent Benchmark Runs</h3>
                    <p className="text-xs text-slate-500 mt-1">Showing the latest {Math.min(5, benchmarkHistory.length)} saved runs.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/70 text-slate-400">
                        <tr>
                          <th className="px-4 py-3 font-medium">Workload</th>
                          <th className="px-4 py-3 font-medium">Requests</th>
                          <th className="px-4 py-3 font-medium">FIFO</th>
                          <th className="px-4 py-3 font-medium">LRU</th>
                          <th className="px-4 py-3 font-medium">LFU</th>
                          <th className="px-4 py-3 font-medium">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {benchmarkHistory.slice(0, 5).map((run) => (
                          <tr key={run._id} className="text-slate-300">
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-200">{run.name || 'Unnamed workload'}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Capacity {run.capacity} · {run.createdAt ? new Date(run.createdAt).toLocaleDateString() : 'Date unavailable'}
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono">{run.requestCount ?? '—'}</td>
                            <td className="px-4 py-3 font-mono">{Number.isFinite(Number(run.results?.FIFO?.hitRatioPercentage)) ? `${Number(run.results.FIFO.hitRatioPercentage).toFixed(2)}%` : '—'}</td>
                            <td className="px-4 py-3 font-mono">{Number.isFinite(Number(run.results?.LRU?.hitRatioPercentage)) ? `${Number(run.results.LRU.hitRatioPercentage).toFixed(2)}%` : '—'}</td>
                            <td className="px-4 py-3 font-mono">{Number.isFinite(Number(run.results?.LFU?.hitRatioPercentage)) ? `${Number(run.results.LFU.hitRatioPercentage).toFixed(2)}%` : '—'}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 rounded bg-teal-500/10 border border-teal-500/20 text-teal-300">
                                {run.bestStrategy || '—'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </>
          );
        })()}
      </section>

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
            {/* User-friendly badge in normal view */}
            <span className="text-xs text-teal-400/90 font-medium bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20">
              Response Cache Sandbox
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
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800 text-[11px]">
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

                {/* Clean Product Summary for Normal View */}
                <div className="font-sans grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-900/50 rounded-lg text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Product</span>
                    <span className="text-slate-200 font-medium">{demoResponse.product?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Category</span>
                    <span className="text-slate-200">{demoResponse.product?.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Price</span>
                    <span className="text-teal-300 font-semibold">${demoResponse.product?.price}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Stock</span>
                    <span className="text-slate-200">{demoResponse.product?.stock} in stock</span>
                  </div>
                </div>

                {/* Collapsible Developer/Debug Section */}
                <div className="border border-slate-800/80 rounded-lg overflow-hidden bg-slate-900/30">
                  <button
                    type="button"
                    onClick={() => setShowDevDiagnostics((prev) => !prev)}
                    className="w-full flex items-center justify-between p-2.5 text-[11px] font-sans text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <Code2 className="w-3.5 h-3.5 text-teal-400" />
                      <span>Developer Diagnostics & Raw Route Data</span>
                    </div>
                    {showDevDiagnostics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showDevDiagnostics && (
                    <div className="p-3 border-t border-slate-800 text-[11px] space-y-2 bg-slate-950 font-mono">
                      <div>
                        <span className="text-slate-500">Route Endpoint: </span>
                        <span className="text-teal-300">GET /api/demo/products/{selectedProductId}?delay={simulatedDelay}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Derived Cache Key: </span>
                        <span className="text-slate-300">{demoResponse.cacheKey}</span>
                      </div>
                      <pre className="text-slate-300 overflow-x-auto p-2 bg-slate-900/70 rounded text-[10px] mt-2 border border-slate-800">
                        {JSON.stringify(demoResponse.product, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
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
