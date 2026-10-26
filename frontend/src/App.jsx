import React, { useState, useEffect } from 'react';
import { Dashboard } from './pages/Dashboard.jsx';
import { Benchmark } from './pages/Benchmark.jsx';
import { History } from './pages/History.jsx';
import { api } from './services/backendApi.js';
import {
  Activity,
  BarChart3,
  Database,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [backendHealth, setBackendHealth] = useState(null);

  const checkHealth = async () => {
    try {
      const res = await api.checkHealth();
      setBackendHealth({ online: true, ...res });
    } catch {
      setBackendHealth({ online: false });
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-teal-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-teal-400" />
                </div>
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white flex items-center space-x-1.5">
                  <span>CacheWise</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 font-mono">
                    v1.0
                  </span>
                </span>
                <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
                  API Caching Middleware & Algorithm Benchmarking
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Dashboard & Demo</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('benchmark')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'benchmark'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Benchmark Engine</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'history'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>History</span>
              </button>
            </nav>

            {/* Subtle Backend Status Indicator */}
            <div className="hidden md:flex items-center space-x-2 text-xs font-mono">
              <div
                title={backendHealth?.online ? 'Backend API connected' : 'Backend API unreachable'}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-[11px] font-sans font-medium transition-colors ${
                  backendHealth?.online
                    ? 'bg-slate-900 text-slate-300 border-slate-800'
                    : 'bg-rose-950/40 text-rose-300 border-rose-800/40'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    backendHealth?.online
                      ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
                      : 'bg-rose-400'
                  }`}
                />
                <span>{backendHealth?.online ? 'Connected' : 'Offline'}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'benchmark' && <Benchmark />}
        {activeTab === 'history' && <History />}
      </main>

      {/* Engineering Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            CacheWise — In-Memory API Caching Middleware and Algorithm Benchmarking Platform
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>FIFO • LRU • LFU in O(1)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default App;

