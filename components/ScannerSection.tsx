
import React from 'react';

interface ScannerSectionProps {
  onFileSelect: (file: File) => void;
  onOpenLibrary: () => void;
}

export const ScannerSection: React.FC<ScannerSectionProps> = ({ onFileSelect, onOpenLibrary }) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-16 py-12 text-center animate-in fade-in duration-700">
      <h2 className="text-8xl font-black text-white tracking-tighter leading-[0.85] italic">Add a Timer to<br/>Any <span className="text-indigo-500">Device.</span></h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div onClick={() => onOpenLibrary()} className="bg-slate-900 border-4 border-slate-800 rounded-[4rem] p-12 h-[300px] flex flex-col items-center justify-center cursor-pointer hover:border-indigo-600 transition-all hover:bg-indigo-600/5 group">
          <div className="w-20 h-20 bg-slate-800 group-hover:bg-indigo-600 rounded-3xl flex items-center justify-center mb-6 transition-all shadow-xl">
             <svg className="w-10 h-10 text-indigo-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
          <p className="text-white font-black text-3xl uppercase italic">From Library</p>
        </div>
        <div onClick={() => inputRef.current?.click()} className="bg-slate-900 border-4 border-dashed border-slate-800 rounded-[4rem] p-12 h-[300px] flex flex-col items-center justify-center cursor-pointer hover:border-indigo-600 transition-all hover:bg-indigo-600/5 group">
          <input type="file" ref={inputRef} onChange={(e) => e.target.files && onFileSelect(e.target.files[0])} className="hidden" accept="image/*" />
          <div className="w-20 h-20 bg-slate-800 group-hover:bg-indigo-600 rounded-3xl flex items-center justify-center mb-6 transition-all shadow-xl">
             <svg className="w-10 h-10 text-indigo-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          </div>
          <p className="text-white font-black text-3xl uppercase italic">Scan Screen</p>
        </div>
      </div>
    </div>
  );
};
