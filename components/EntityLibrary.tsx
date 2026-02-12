
import React, { useMemo, useState } from 'react';
import { AppState, AppAction } from '../types';
import { ENTITY_REGEX_G, ENTITY_REGEX_VALIDATE } from '../constants/app';

interface EntityLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export const EntityLibrary: React.FC<EntityLibraryProps> = ({ isOpen, onClose, state, dispatch }) => {
  const [isDragging, setIsDragging] = useState(false);

  const getGroup = (id: string) => {
    const domain = id.split('.')[0]?.toLowerCase();
    if (domain === 'valve' || id.includes('valve')) return 'Valves';
    if (domain === 'switch') return 'Switches';
    if (domain === 'light') return 'Lights';
    if (domain === 'climate') return 'Climate';
    if (domain === 'fan') return 'Fans';
    if (domain === 'vacuum') return 'Cleaning';
    if (domain === 'media_player') return 'Media';
    if (domain === 'cover') return 'Covers';
    if (domain === 'binary_sensor' || domain === 'sensor') return 'Sensors';
    return 'Other';
  };

  const handleMagicExtract = (inputText: string) => {
    if (!inputText.trim()) return;
    let foundEntities: string[] = [];

    // Try parsing as JSON first
    try {
      const parsed = JSON.parse(inputText);
      let candidates: string[] = [];
      if (Array.isArray(parsed)) {
        candidates = parsed.map(item => item.entity_id).filter(id => typeof id === 'string');
      } else if (typeof parsed === 'object' && parsed !== null) {
        candidates = Object.keys(parsed);
      }
      
      const filtered = candidates.filter(k => ENTITY_REGEX_VALIDATE.test(k));
      if (filtered.length > 0) {
        foundEntities = Array.from(new Set(filtered.map(m => m.toLowerCase()))).sort();
      }
    } catch (e) {
      // Not JSON, fallback to regex matching
      const matches = inputText.match(ENTITY_REGEX_G);
      if (matches) {
        foundEntities = Array.from(new Set(matches.map(m => m.toLowerCase()))).sort();
      }
    }

    if (foundEntities.length > 0) {
      const existing = state.rawEntityList.split('\n').filter(i => i.trim());
      const combined = Array.from(new Set([...existing, ...foundEntities])).sort().join('\n');
      dispatch({ type: 'SET_RAW_ENTITY_LIST', payload: combined });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => handleMagicExtract(event.target?.result as string);
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => handleMagicExtract(event.target?.result as string);
      reader.readAsText(file);
    }
  };

  const grouped = useMemo(() => {
    const filtered = state.rawEntityList.split('\n').filter(id => 
      id.includes('.') && id.toLowerCase().includes(state.quickSearch.toLowerCase())
    );
    const groups: Record<string, string[]> = {};
    filtered.forEach(id => {
      const g = getGroup(id);
      if (!groups[g]) groups[g] = [];
      groups[g].push(id);
    });
    return groups;
  }, [state.rawEntityList, state.quickSearch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl" onClick={onClose} />
      <div className="relative bg-slate-900 border-4 border-indigo-600/30 rounded-[3.5rem] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-3xl">
        <div className="px-12 py-10 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">Entity Library</h2>
          <button onClick={onClose} className="p-4 bg-slate-800 hover:bg-red-600 rounded-2xl text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-grow flex overflow-hidden">
          <div className="w-64 bg-black/20 border-r border-white/5 p-6 flex flex-col gap-3">
            <button 
              onClick={() => dispatch({ type: 'SET_LIST_MANAGER_TAB', payload: 'manual' })} 
              className={`w-full text-left px-6 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${state.listManagerTab === 'manual' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Manual List
            </button>
            <button 
              onClick={() => dispatch({ type: 'SET_LIST_MANAGER_TAB', payload: 'json' })} 
              className={`w-full text-left px-6 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${state.listManagerTab === 'json' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Import JSON
            </button>
            <button 
              onClick={() => {
                if (window.confirm("Clear all entities from library?")) dispatch({ type: 'SET_RAW_ENTITY_LIST', payload: '' });
              }} 
              className="mt-auto px-6 py-4 text-red-500 font-black text-[10px] uppercase italic hover:bg-red-500/10 rounded-2xl transition-all"
            >
              Clear Library
            </button>
          </div>
          
          <div className="flex-grow p-12 overflow-y-auto custom-scrollbar space-y-8">
            <div className="flex items-center gap-4 bg-black/40 border border-slate-800 p-4 rounded-2xl">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" 
                placeholder="Search library..." 
                value={state.quickSearch} 
                onChange={(e) => dispatch({ type: 'SET_QUICK_SEARCH', payload: e.target.value })}
                className="bg-transparent border-none outline-none text-white font-bold w-full italic placeholder:text-slate-700"
              />
            </div>

            {state.listManagerTab === 'manual' && (
              <textarea 
                value={state.rawEntityList} 
                onChange={(e) => dispatch({ type: 'SET_RAW_ENTITY_LIST', payload: e.target.value })}
                placeholder="switch.bedroom_lamp&#10;valve.garden_tap"
                className="w-full h-48 bg-black/40 border-2 border-slate-800 rounded-3xl p-6 text-indigo-300 font-mono text-xs focus:border-indigo-600 outline-none transition-all"
              />
            )}

            {state.listManagerTab === 'json' && (
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('json-upload')?.click()}
                className={`border-4 border-dashed rounded-[3rem] p-16 flex flex-col items-center justify-center text-center transition-all cursor-pointer group ${isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 hover:border-indigo-600/50 hover:bg-indigo-600/5'}`}
              >
                <input id="json-upload" type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors shadow-xl">
                  <svg className="w-8 h-8 text-indigo-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                </div>
                <p className="text-white font-black text-xl uppercase italic">Drop JSON or Click</p>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2 opacity-60">States exported from HA Developer Tools</p>
              </div>
            )}

            <div className="space-y-12">
              {Object.entries(grouped).length > 0 ? (
                Object.entries(grouped).map(([name, entities]) => (
                  <div key={name} className="space-y-4">
                    <h3 className="text-indigo-400 font-black italic uppercase tracking-widest pl-4 border-l-4 border-indigo-600">{name}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(entities as string[]).map(id => (
                        <button key={id} onClick={() => {
                          dispatch({ type: 'SELECT_ENTITY', payload: { entityId: id, name: id.split('.')[1].replace(/_/g, ' '), type: 'other' } });
                          dispatch({ type: 'SET_IMAGE', payload: 'DIRECT_SELECTION' });
                          onClose();
                        }} className="bg-slate-800/40 p-5 rounded-3xl border border-slate-800 text-left hover:border-indigo-600/50 hover:bg-indigo-600/5 group transition-all flex items-center gap-4">
                          <div className="w-10 h-10 bg-black/40 rounded-xl flex items-center justify-center shrink-0 border border-white/5">
                            <svg className="w-5 h-5 text-indigo-500/50 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-black italic uppercase text-[10px] truncate leading-tight mb-0.5">{id.split('.')[1].replace(/_/g, ' ')}</p>
                            <code className="text-[8px] text-slate-600 font-mono block truncate opacity-70">{id}</code>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-600 font-black uppercase italic tracking-widest text-xs">No entities in library</p>
                  <p className="text-slate-700 text-[10px] mt-2 font-bold">Import a JSON file or paste IDs manually above.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
