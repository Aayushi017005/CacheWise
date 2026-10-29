import React from 'react';
import { Award } from 'lucide-react';

export function BenchmarkTable({ results, bestStrategy }) {
  if (!results) return null;

  const strategies = ['LRU', 'LFU', 'FIFO'];
  const highestHitRatio = Math.max(...strategies.map((strategy) => results[strategy]?.hitRatio ?? -1));
  const isTie = bestStrategy === 'Tie';

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="bg-slate-950/70 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
          <tr>
            <th className="py-3.5 px-4 font-semibold">Algorithm</th>
            <th className="py-3.5 px-4 font-semibold">Hit Ratio</th>
            <th className="py-3.5 px-4 font-semibold">Hits</th>
            <th className="py-3.5 px-4 font-semibold">Misses</th>
            <th className="py-3.5 px-4 font-semibold">Evictions</th>
            <th className="py-3.5 px-4 font-semibold">Execution Latency</th>
            <th className="py-3.5 px-4 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 font-mono text-xs">
          {strategies.map((strat) => {
            const data = results[strat];
            if (!data) return null;
            const isTopRatio = data.hitRatio === highestHitRatio;
            const isWinner = !isTie && strat === bestStrategy;

            return (
              <tr
                key={strat}
                className={`hover:bg-slate-800/40 transition-colors ${
                  isTopRatio ? 'bg-teal-500/5' : ''
                }`}
              >
                <td className="py-3.5 px-4 font-sans font-bold text-slate-200">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{strat}</span>
                    {isTopRatio && (
                      <span className="flex items-center space-x-1 px-2 py-0.5 text-[10px] rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                        <Award className="w-3 h-3 text-teal-400" />
                        <span>{isTie ? 'Tied Best' : 'Best Ratio'}</span>
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-bold ${isTopRatio ? 'text-teal-400' : 'text-slate-200'}`}>
                      {data.hitRatioPercentage}%
                    </span>
                    <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full ${isTopRatio ? 'bg-teal-500' : 'bg-slate-500'}`}
                        style={{ width: `${Math.min(data.hitRatioPercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-emerald-400 font-semibold">{data.hits}</td>
                <td className="py-3.5 px-4 text-amber-400 font-semibold">{data.misses}</td>
                <td className="py-3.5 px-4 text-rose-400 font-semibold">{data.evictions}</td>
                <td className="py-3.5 px-4 text-slate-400">{data.executionTimeMs} ms</td>
                <td className="py-3.5 px-4 font-sans">
                  {isWinner ? (
                    <span className="text-teal-400 font-medium">Optimal for workload</span>
                  ) : isTopRatio && isTie ? (
                    <span className="text-teal-300 font-medium">Tied best ratio</span>
                  ) : (
                    <span className="text-slate-500">Evaluated</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
