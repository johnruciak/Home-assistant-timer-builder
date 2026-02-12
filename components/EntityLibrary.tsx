
import React, { useMemo } from 'react';
import { AppState, AppAction, DiscoveredEntity } from '../types';

interface EntityLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export const EntityLibrary: React.FC<EntityLibraryProps> = ({ isOpen, onClose, state, dispatch }) => {
  const getGroup = (id: string) => {
    const domain = id.split('.')[0]?.toLowerCase();
    if (domain === 'valve' || id.includes('valve')) return 'Valves';
    if (domain === 'switch') return 'Switches';
    if (domain === 'light') return 'Lights';
    if (domain === 'climate') return 'Climate';
    return 'Other';
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
            <button onClick={() => dispatch({ type: 'SET_LIST_MANAGER_TAB', payload: 'manual' })} className={`w-full text-left px-6 py-4 rounded-2xl text-[10px] font-black uppercase ${state.listManagerTab === 'manual' ? 'bg-indigo-600' : 'text-slate-500'}`}>Manual List</button>
            <button onClick={() => {
              if (window.confirm("Clear all entities?")) dispatch({ type: 'SET_RAW_ENTITY_LIST', payload: '' });
            }} className="mt-auto px-6 py-4 text-red-500 font-black text-[10px] uppercase italic">Clear All</button>
          </div>
          <div className="flex-grow p-12 overflow-y-auto custom-scrollbar space-y-8">
            <div className="flex items-center gap-4 bg-black/40 border border-slate-800 p-4 rounded-2xl">
              <input 
                type="text" 
                placeholder="Search library..." 
                value={state.quickSearch} 
                onChange={(e) => dispatch({ type: 'SET_QUICK_SEARCH', payload: e.target.value })}
                className="bg-transparent border-none outline-none text-white font-bold w-full italic"
              />
            </div>
            {state.listManagerTab === 'manual' && (
              <textarea 
                value={state.rawEntityList} 
                onChange={(e) => dispatch({ type: 'SET_RAW_ENTITY_LIST', payload: e.target.value })}
                placeholder="switch.bedroom_lamp&#10;valve.garden_tap"
                className="w-full h-48 bg-black/40 border-2 border-slate-800 rounded-3xl p-6 text-indigo-300 font-mono text-xs"
              />
            )}
            <div className="space-y-12">
              {Object.entries(grouped).map(([name, entities]) => (
                <div key={name} className="space-y-4">
                  <h3 className="text-indigo-400 font-black italic uppercase tracking-widest pl-4 border-l-4 border-indigo-600">{name}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Explicitly cast entities to string[] to resolve type inference errors where it might be typed as unknown */}
                    {(entities as string[]).map(id => (
                      <button key={id} onClick={() => {
                        dispatch({ type: 'SELECT_ENTITY', payload: { entityId: id, name: id.split('.')[1], type: 'other' } });
                        dispatch({ type: 'SET_IMAGE', payload: 'DIRECT_SELECTION' });
                        onClose();
                      }} className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800 text-left hover:border-indigo-600 group transition-all">
                        <p className="text-white font-black italic uppercase text-[10px] truncate">{id.split('.')[1]}</p>
                        <code className="text-[8px] text-slate-500 font-mono group-hover:text-indigo-400">{id}</code>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
