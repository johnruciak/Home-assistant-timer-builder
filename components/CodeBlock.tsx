import React, { useState } from 'react';

interface CodeBlockProps {
  title: string;
  subtitle?: string;
  code: string;
  filename: string;
  stepNumber?: number;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ title, subtitle, code, filename, stepNumber }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedFilename, setCopiedFilename] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyFilename = () => {
    navigator.clipboard.writeText(filename);
    setCopiedFilename(true);
    setTimeout(() => setCopiedFilename(false), 2000);
  };

  const downloadFile = () => {
    const blob = new Blob([code], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!code) return null;

  return (
    <div className="bg-[#0f172a]/80 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-800/50 backdrop-blur-sm group">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-8 py-6 bg-slate-900/50 border-b border-slate-800/50 gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {stepNumber && (
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-sm italic shadow-lg shadow-indigo-600/20 shrink-0">
              {stepNumber}
            </div>
          )}
          <div className="min-w-0">
            <h4 className="text-sm font-black text-indigo-400 uppercase tracking-[0.2em] italic truncate">
              {title} {subtitle && <span className="text-slate-500 normal-case tracking-normal ml-2">({subtitle})</span>}
            </h4>
            <button 
              onClick={copyFilename}
              className="mt-1 flex items-center gap-2 text-slate-400 hover:text-white transition-all group/fn"
              title="Click to copy filename"
            >
              <code className="text-xs font-mono truncate">{filename}</code>
              <svg className={`w-3.5 h-3.5 transition-all ${copiedFilename ? 'text-green-500 scale-125' : 'opacity-0 group-hover/fn:opacity-100'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {copiedFilename ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={copyCode}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 border border-white/5 ${
              copiedCode ? 'bg-green-600 text-white border-green-500' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {copiedCode ? 'COPIED' : 'COPY CODE'}
          </button>
          
          <button
            onClick={downloadFile}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl shadow-indigo-600/20 active:scale-95 border border-indigo-400/20"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            DOWNLOAD
          </button>
        </div>
      </div>
      
      {/* Code Area */}
      <div className="relative">
        <pre className="p-8 text-sm md:text-base font-mono text-indigo-200/90 overflow-x-auto whitespace-pre leading-relaxed custom-scrollbar bg-black/40">
          {code}
        </pre>
        <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/20 pointer-events-none" />
      </div>
    </div>
  );
};