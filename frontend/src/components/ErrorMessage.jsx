import React from 'react';
import { AlertCircle } from 'lucide-react';

export function ErrorMessage({ title = 'An error occurred', message, onRetry }) {
  return (
    <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-5 my-4 text-rose-200">
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-semibold text-sm text-rose-300">{title}</h4>
          <p className="text-xs text-rose-300/80 mt-1 font-mono">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-900/60 hover:bg-rose-800 border border-rose-700 text-rose-100 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

