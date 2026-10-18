import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export function HitRatioChart({ results }) {
  if (!results) return null;

  const chartData = [
    {
      name: 'LRU',
      hitRatio: results.LRU?.hitRatioPercentage || 0,
      hits: results.LRU?.hits || 0,
      misses: results.LRU?.misses || 0,
      evictions: results.LRU?.evictions || 0,
    },
    {
      name: 'LFU',
      hitRatio: results.LFU?.hitRatioPercentage || 0,
      hits: results.LFU?.hits || 0,
      misses: results.LFU?.misses || 0,
      evictions: results.LFU?.evictions || 0,
    },
    {
      name: 'FIFO',
      hitRatio: results.FIFO?.hitRatioPercentage || 0,
      hits: results.FIFO?.hits || 0,
      misses: results.FIFO?.misses || 0,
      evictions: results.FIFO?.evictions || 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Hit Ratio % Chart */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h4 className="text-sm font-semibold text-slate-200 mb-4">Hit Ratio Comparison (%)</h4>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} unit="%" domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
              />
              <Bar dataKey="hitRatio" name="Hit Ratio (%)" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hits vs Misses Breakdown */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h4 className="text-sm font-semibold text-slate-200 mb-4">Hits, Misses & Evictions Breakdown</h4>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              />
              <Bar dataKey="hits" name="Hits" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="misses" name="Misses" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              <Bar dataKey="evictions" name="Evictions" fill="#f43f5e" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

