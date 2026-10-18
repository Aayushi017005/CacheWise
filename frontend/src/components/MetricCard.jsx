import React from 'react';

export function MetricCard({ title, value, subtitle, icon: Icon, color = 'teal', trend }) {
  const colorStyles = {
    teal: 'bg-teal-500/10 border-teal-500/30 text-teal-400',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    rose: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
  };

  const badgeStyle = colorStyles[color] || colorStyles.teal;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-lg border ${badgeStyle}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="flex items-baseline space-x-2">
        <div className="text-2xl font-bold font-mono text-slate-100">{value}</div>
        {trend && <span className="text-xs text-slate-400 font-mono">{trend}</span>}
      </div>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}

