import React, { useState, useEffect } from 'react';
import { api } from '../services/backendApi.js';
import { BenchmarkTable } from '../components/BenchmarkTable.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { ErrorMessage } from '../components/ErrorMessage.jsx';
import { AiInsightsViewer } from '../components/AiInsightsViewer.jsx';
import {
  History as HistoryIcon,
  Database,
  Trash2,
  ChevronDown,
  ChevronUp,
  Brain,
  Calendar,
  Layers,
  RotateCcw,
} from 'lucide-react';

export function History() {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPersistedToDb, setIsPersistedToDb] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getBenchmarkHistory();
      setHistoryList(res.data || []);
      setIsPersistedToDb(Boolean(res.persistedToDb));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this saved benchmark record?')) return;
    try {
      await api.deleteBenchmarkHistory(id);
      setHistoryList((prev) => prev.filter((item) => item._id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span
              className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                isPersistedToDb
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              {isPersistedToDb ? 'MongoDB Connected' : 'In-Memory Storage Mode'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {historyList.length} saved benchmark runs
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-2 flex items-center space-x-2">
            <Database className="w-5 h-5 text-teal-400" />
            <span>Benchmark Run History</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Persisted records of previous algorithmic evaluations, metrics, and generated AI explanations.
          </p>
        </div>

        <button
          onClick={loadHistory}
          className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors self-start md:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh History</span>
        </button>
      </div>

      {error && <ErrorMessage title="Failed to load history" message={error} onRetry={loadHistory} />}

      {loading ? (
        <LoadingState message="Fetching saved benchmarks..." />
      ) : historyList.length === 0 ? (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-xl p-12 text-center text-slate-500">
          <HistoryIcon className="w-10 h-10 mx-auto text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-400">No saved benchmark runs yet</p>
          <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
            Run a simulation on the Benchmark tab and click "Save to History" to store your results for future reference.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {historyList.map((item) => {
            const isExpanded = expandedId === item._id;
            const createdDate = item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A';

            return (
              <div
                key={item._id}
                className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors"
              >
                {/* Summary Row */}
                <div
                  onClick={() => toggleExpand(item._id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-start sm:items-center space-x-3">
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-teal-400">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
                        <span>{item.name || 'Unnamed Workload'}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-500/10 text-teal-300 border border-teal-500/30">
                          Winner: {item.bestStrategy}
                        </span>
                      </h4>
                      <div className="flex items-center space-x-3 text-xs text-slate-500 font-mono mt-1">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{createdDate}</span>
                        </span>
                        <span>Capacity: {item.capacity}</span>
                        <span>Requests: {item.requestCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                    {item.aiInsights && (
                      <span className="flex items-center space-x-1 px-2 py-1 text-[11px] rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
                        <Brain className="w-3 h-3 text-purple-400" />
                        <span>AI Explained</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleDelete(item._id, e)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Run"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="p-1.5 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-5 pt-0 border-t border-slate-800/80 bg-slate-950/40 space-y-4">
                    <div className="pt-4">
                      <BenchmarkTable results={item.results} bestStrategy={item.bestStrategy} />
                    </div>

                    {item.requestSequence && item.requestSequence.length > 0 && (
                      <div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs font-mono text-slate-400">
                        <span className="text-slate-500">Request Sequence: </span>
                        [{item.requestSequence.join(', ')}]
                      </div>
                    )}

                    {item.aiInsights && (
                      <div className="pt-2">
                        <AiInsightsViewer
                          insights={{
                            explanation: item.aiInsights,
                            provider: 'Saved Architectural Analysis',
                          }}
                          benchmark={item}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

