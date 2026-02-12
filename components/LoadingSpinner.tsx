
import React from 'react';

interface LoadingSpinnerProps {
  label: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ label }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-8 animate-in fade-in duration-500">
      <div className="relative">
        <div className="w-24 h-24 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
             <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
             </svg>
           </div>
        </div>
      </div>
      <div className="text-center">
        <p className="text-4xl font-black italic tracking-tighter text-white uppercase animate-pulse">{label}</p>
        <p className="text-indigo-400/50 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Processing Data Source</p>
      </div>
    </div>
  );
};
