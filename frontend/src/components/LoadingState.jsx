import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingState({ message = 'Loading data...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-3" />
      <p className="text-sm font-mono">{message}</p>
    </div>
  );
}

