
import React from 'react';

interface ErrorDisplayProps {
  error: string | null;
  onDismiss: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onDismiss }) => {
  if (!error) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] w-full max-w-xl px-4 animate-in slide-in-from-bottom-4">
      <div className="bg-red-600/90 backdrop-blur-xl border-2 border-red-500/50 rounded-3xl p-6 shadow-2xl flex items-center gap-6 text-white">
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-grow">
          <p className="font-black uppercase italic text-xs tracking-widest opacity-60 mb-0.5">System Alert</p>
          <p className="text-sm font-bold leading-tight">{error}</p>
        </div>
        <button 
          onClick={onDismiss}
          className="p-3 hover:bg-white/10 rounded-xl transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
