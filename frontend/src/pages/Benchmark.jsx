import React, { useState } from 'react';
import { api } from '../services/backendApi.js';
import { BenchmarkTable } from '../components/BenchmarkTable.jsx';
import { HitRatioChart } from '../components/HitRatioChart.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { ErrorMessage } from '../components/ErrorMessage.jsx';
import { AiInsightsViewer } from '../components/AiInsightsViewer.jsx';
import {
  Play,
  Save,
  Brain,
  Sparkles,
  BarChart3,
  BookmarkPlus,
  HelpCircle,
  CheckCircle,
} from 'lucide-react';

const PRESET_WORKLOADS = [
  {
    name: 'Hand-Calculated Example',
    capacity: 3,
    requests: 'A, B, A, C, D, A, B',
    desc: 'The reference workload from specification (LRU/LFU 28.57% vs FIFO 14.29%)',
  },
  {
    name: 'Temporal Locality (Recency Bursts)',
    capacity: 3,
    requests: 'A, B, C, A, A, B, D, A, B, C, A, B',
    desc: 'Favors LRU: recently accessed keys are re-requested before capacity eviction',
  },
  {
    name: 'Frequency Skew (Pareto / Hot Items)',
    capacity: 3,
    requests: 'A, A, A, B, B, C, D, A, A, B, E, A, B, F',
    desc: 'Favors LFU: persistent hot keys "A" and "B" retain residency over newer single-use items',
  },
  {
    name: 'Cyclic Loop (Cache Thrashing)',
    capacity: 3,
    requests: 'A, B, C, D, A, B, C, D, A, B, C, D',
    desc: 'Pathological case for LRU & FIFO (loop length > capacity = 0% hit ratio)',
  },
];

export function Benchmark() {
  const [workloadName, setWorkloadName] = useState('Repeated product requests');
  const [capacity, setCapacity] = useState(3);
  const [ttlMs, setTtlMs] = useState(60000);
  const [rawRequests, setRawRequests] = useState('A, B, A, C, D, A, B');

  const [isRunning, setIsRunning] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState(null);
  const [error, setError] = useState(null);

  // Persistence state
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccessId, setSavedSuccessId] = useState(null);

  // AI insights state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);

  const applyPreset = (preset) => {
    setWorkloadName(preset.name);
    setCapacity(preset.capacity);
    setRawRequests(preset.requests);
    setBenchmarkResult(null);
    setAiInsights(null);
    setSavedSuccessId(null);
  };

  const handleRunBenchmark = async (e) => {
    if (e) e.preventDefault();

    // Parse comma- or space-separated request keys
    const requests = rawRequests
      .split(/[\s,]+/)
      .map((k) => k.trim())
      .filter(Boolean);

    if (requests.length === 0) {
      setError('Please provide at least one request key in the sequence.');
      return;
    }

    setIsRunning(true);
    setError(null);
    setAiInsights(null);
    setSavedSuccessId(null);

    try {
      const data = await api.runBenchmark({
        name: workloadName,
        capacity: Number(capacity),
        ttlMs: Number(ttlMs) || null,
        requests,
      });
      setBenchmarkResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveToHistory = async () => {
    if (!benchmarkResult) return;
    setIsSaving(true);
    try {
      const requests = rawRequests.split(/[\s,]+/).map((k) => k.trim()).filter(Boolean);
      const res = await api.saveBenchmarkHistory({
        name: benchmarkResult.name,
        capacity: benchmarkResult.capacity,
        ttlMs: benchmarkResult.ttlMs,
        requests,
        requestCount: benchmarkResult.requestCount,
        results: benchmarkResult.results,
        bestStrategy: benchmarkResult.bestStrategy,
        aiInsights: aiInsights?.explanation || null,
      });
      setSavedSuccessId(res.data._id);
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestAiInsights = async () => {
    if (!benchmarkResult) return;
    setAiLoading(true);
    try {
      const insights = await api.getAiInsights(benchmarkResult, savedSuccessId);
      setAiInsights(insights);
    } catch (err) {
      alert(`AI explanation failed: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-teal-400" />
          <span>Cache Algorithm Benchmarking Engine</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          Feed identical request streams into independent, scratch-implemented <strong>FIFO</strong>, <strong>LRU</strong>, and <strong>LFU</strong> caches.
          All calculations are mathematically deterministic backend measurements.
        </p>

        {/* Quick Presets */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Load Workload Preset:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {PRESET_WORKLOADS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(preset)}
                className="text-left p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-teal-500/50 hover:bg-slate-900 transition-colors text-xs"
              >
                <div className="font-semibold text-slate-200">{preset.name}</div>
                <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{preset.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
        <form onSubmit={handleRunBenchmark} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Workload Name</label>
              <input
                type="text"
                value={workloadName}
                onChange={(e) => setWorkloadName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                placeholder="e.g. E-Commerce Flash Sale Access"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Cache Capacity</label>
              <input
                type="number"
                min="1"
                max="1000"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Simulated TTL (ms)</label>
              <input
                type="number"
                min="0"
                step="5000"
                value={ttlMs}
                onChange={(e) => setTtlMs(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Request Sequence (keys separated by comma or space)
            </label>
            <textarea
              rows="2"
              value={rawRequests}
              onChange={(e) => setRawRequests(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono tracking-wider"
              placeholder="A, B, A, C, D, A, B"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Each key simulates a unique resource ID requested by incoming API traffic.
            </p>
          </div>

          {error && <ErrorMessage message={error} />}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isRunning}
              className="flex items-center space-x-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isRunning ? 'Running Simulation...' : 'Execute Benchmark Comparison'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Benchmark Results */}
      {benchmarkResult && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                Workload: <span className="text-teal-400">{benchmarkResult.name}</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {benchmarkResult.requestCount} requests | Capacity: {benchmarkResult.capacity} | {benchmarkResult.bestStrategy === 'Tie' ? 'Result:' : 'Winner:'}{' '}
                <span className="text-emerald-400 font-bold">{benchmarkResult.bestStrategy}</span>
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleSaveToHistory}
                disabled={isSaving || savedSuccessId !== null}
                className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
              >
                {savedSuccessId ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Saved successfully</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-teal-400" />
                    <span>{isSaving ? 'Saving...' : 'Save to History'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleRequestAiInsights}
                disabled={aiLoading}
                className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-500 text-white shadow-sm transition-colors disabled:opacity-50"
              >
                <Brain className="w-3.5 h-3.5" />
                <span>{aiLoading ? 'Consulting AI...' : 'Explain with AI'}</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <BenchmarkTable
            results={benchmarkResult.results}
            bestStrategy={benchmarkResult.bestStrategy}
          />

          {/* Recharts Visualizations */}
          <HitRatioChart results={benchmarkResult.results} />

          {/* AI Insights Card */}
          {aiLoading && <LoadingState message="Analyzing workload access patterns and trade-offs..." />}

          {aiInsights && (
            <AiInsightsViewer
              insights={aiInsights}
              benchmark={benchmarkResult}
            />
          )}
        </div>
      )}
    </div>
  );
}

