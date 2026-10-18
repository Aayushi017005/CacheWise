import React, { useState } from 'react';
import { Settings, Trash2, CheckCircle2 } from 'lucide-react';

export function CacheControls({ currentConfig, onUpdateConfig, onClearCache }) {
  const [strategy, setStrategy] = useState(currentConfig?.strategy || 'LRU');
  const [capacity, setCapacity] = useState(currentConfig?.capacity || 100);
  const [ttlMs, setTtlMs] = useState(currentConfig?.ttlMs || 60000);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage(null);
    try {
      await onUpdateConfig({
        strategy,
        capacity: Number(capacity),
        ttlMs: Number(ttlMs),
      });
      setMessage('Cache configuration updated successfully!');
      setTimeout(() => setMessage(null), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClear = async () => {
    if (window.confirm('Clear all cached entries and reset performance metrics?')) {
      await onClearCache();
      setMessage('Cache cleared successfully and metrics reset.');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-teal-400" />
          <h3 className="text-base font-semibold text-slate-100">Cache Settings</h3>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-rose-400 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Cache</span>
        </button>
      </div>

      {message && (
        <div className="flex items-center space-x-2 p-3 mb-4 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs">
          <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Strategy */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Eviction Strategy
            </label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
            >
              <option value="LRU">LRU (Least Recently Used)</option>
              <option value="LFU">LFU (Least Frequently Used)</option>
              <option value="FIFO">FIFO (First-In, First-Out)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">Switching strategies resets the active cache.</p>
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Maximum Capacity
            </label>
            <input
              type="number"
              min="1"
              max="10000"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">Maximum number of entries stored in memory.</p>
          </div>

          {/* TTL */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Default TTL (ms)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={ttlMs}
              onChange={(e) => setTtlMs(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">Time-to-live in ms (set to 0 to disable expiration).</p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isUpdating}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {isUpdating ? 'Saving...' : 'Apply Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

