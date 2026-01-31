
import React, { useState } from 'react';

interface CodeBlockProps {
  title: string;
  code: string;
  filename: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ title, code, filename }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!code) return null;

  return (
    <div className="mt-6 bg-slate-900 rounded-xl overflow-hidden shadow-xl border border-slate-800">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">{title}</span>
          <span className="text-xs text-slate-500 italic">({filename})</span>
        </div>
        <button
          onClick={copyToClipboard}
          className={`text-xs px-3 py-1 rounded transition-all font-medium ${
            copied ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 text-sm font-mono text-indigo-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
        {code}
      </pre>
    </div>
  );
};
