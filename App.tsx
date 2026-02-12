
import React, { useReducer, useEffect, useCallback, useRef } from 'react';
import { analyzeImage, generateYaml } from './services/gemini';
import { appReducer, initialState } from './state/reducer';
import { DiscoveredEntity } from './types';
import { CodeBlock } from './components/CodeBlock';

// Sub-components
import { GuideModal } from './components/GuideModal';
import { EntityLibrary } from './components/EntityLibrary';
import { ScannerSection } from './components/ScannerSection';
import { ConfigurationForm } from './components/ConfigurationForm';
import { ErrorDisplay } from './components/ErrorDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';

const App: React.FC = () => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      dispatch({ type: 'SET_KEY_CONFIGURED', payload: hasKey });
    };
    checkKey();
  }, []);

  const handleActivate = async () => {
    // Assume key selection is successful immediately after opening selection dialog
    await window.aistudio.openSelectKey();
    dispatch({ type: 'SET_KEY_CONFIGURED', payload: true });
  };

  const handleError = useCallback((err: any) => {
    // Reset key configuration state if API key validation fails
    if (err?.message?.includes('Requested entity was not found')) {
      dispatch({ type: 'SET_KEY_CONFIGURED', payload: false });
      dispatch({ type: 'SET_ERROR', payload: "API Key verification failed. Please select a valid key from a paid project." });
    } else {
      dispatch({ type: 'SET_ERROR', payload: err?.message || "An unexpected system error occurred." });
    }
  }, []);

  const triggerDiscovery = async (base64: string) => {
    if (base64 === 'DIRECT_SELECTION') return;
    dispatch({ type: 'SET_ANALYSING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const result = await analyzeImage(base64);
      dispatch({ type: 'SET_DISCOVERY', payload: result });
      if (result.entities && result.entities.length === 1) {
        dispatch({ type: 'SELECT_ENTITY', payload: result.entities[0] });
      }
    } catch (err) {
      handleError(err);
    } finally {
      dispatch({ type: 'SET_ANALYSING', payload: false });
    }
  };

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        dispatch({ type: 'SET_IMAGE', payload: base64 });
        dispatch({ type: 'SET_DISCOVERY', payload: null });
        dispatch({ type: 'SET_YAML', payload: null });
        triggerDiscovery(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    dispatch({ type: 'SET_GENERATING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const result = await generateYaml({
        deviceName: state.customName,
        entityId: state.customEntityId,
        duration: state.duration,
        safety: true,
        helper: true,
        scheduleMode: state.scheduleMode,
        scheduleTime: state.scheduleTime,
        recurrence: state.scheduleMode !== 'none' ? state.recurrence : undefined
      });
      dispatch({ type: 'SET_YAML', payload: result });
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      handleError(err);
    } finally {
      dispatch({ type: 'SET_GENERATING', payload: false });
    }
  };

  // Mandatory activation screen for users without a selected API key
  if (state.isKeyConfigured === false) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-8">
        <div className="max-w-2xl w-full bg-slate-900 border-2 border-indigo-600/30 rounded-[4rem] p-16 text-center space-y-10 shadow-3xl">
          <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-2xl">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">Activation Required</h2>
          
          <div className="space-y-4">
            <p className="text-slate-400 text-lg">
              To use Gemini 3 Pro reasoning features, you must select an API key from a paid Google Cloud project.
            </p>
            {/* Added mandatory billing link per developer guidelines */}
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-block text-indigo-400 hover:text-indigo-300 font-bold underline decoration-indigo-600/50 underline-offset-4 transition-all"
            >
              Learn about Gemini API billing documentation
            </a>
          </div>

          <button onClick={handleActivate} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-8 rounded-3xl text-xl uppercase italic">ACTIVATE SYSTEM</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] font-sans text-slate-100 overflow-x-hidden">
      <ErrorDisplay error={state.error} onDismiss={() => dispatch({ type: 'SET_ERROR', payload: null })} />
      
      <GuideModal isOpen={state.showGuide} onClose={() => dispatch({ type: 'SET_SHOW_GUIDE', payload: false })} />
      <EntityLibrary 
        isOpen={state.showListManager} 
        onClose={() => dispatch({ type: 'SET_SHOW_LIST_MANAGER', payload: false })}
        state={state}
        dispatch={dispatch}
      />

      <nav className="sticky top-0 z-40 bg-[#020617]/80 border-b border-slate-800/50 px-8 py-4 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => dispatch({ type: 'RESET_APP' })}>
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h1 className="font-black text-2xl text-white tracking-tighter italic uppercase">EntityTimer</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={() => dispatch({ type: 'SET_SHOW_LIST_MANAGER', payload: true })} className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase italic">Library</button>
            <button onClick={() => dispatch({ type: 'SET_SHOW_GUIDE', payload: true })} className="px-5 py-2.5 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase italic">Setup Help</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-16">
        {!state.image ? (
          <ScannerSection onFileSelect={handleFile} onOpenLibrary={() => dispatch({ type: 'SET_SHOW_LIST_MANAGER', payload: true })} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
             <div className="lg:col-span-4 sticky top-28">
               <div className="bg-slate-900 p-4 rounded-[3rem] border border-slate-800 overflow-hidden shadow-2xl">
                 {state.image === 'DIRECT_SELECTION' ? (
                   <div className="aspect-video bg-indigo-900/30 flex items-center justify-center text-white italic font-black uppercase tracking-widest">Manual Setup</div>
                 ) : (
                   <img src={state.image} className="w-full opacity-70" alt="Dashboard" />
                 )}
               </div>
             </div>

             <div className="lg:col-span-8 space-y-12">
               {state.analysing && <LoadingSpinner label="Analysing View..." />}
               {state.generating && <LoadingSpinner label="Building Timer..." />}
               
               {!state.analysing && !state.generating && (
                 <>
                   {state.yaml ? (
                     <div ref={resultsRef} className="space-y-12 animate-in slide-in-from-bottom-12 pb-32">
                        <div className="flex flex-col md:flex-row md:items-end justify-between px-8 gap-4">
                          <div>
                            <h3 className="text-6xl font-black text-white italic tracking-tighter uppercase leading-none">Timer Ready</h3>
                            <p className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.3em] mt-2 italic">Configuration packages generated</p>
                          </div>
                          <div className="flex gap-4">
                            <button 
                              onClick={() => dispatch({ type: 'SET_YAML', payload: null })} 
                              className="px-6 py-3 bg-slate-800 text-slate-300 hover:text-white rounded-2xl text-[10px] font-black uppercase italic border border-white/5 transition-all"
                            >
                              Edit Settings
                            </button>
                            <button 
                              onClick={() => dispatch({ type: 'RESET_APP' })} 
                              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase italic shadow-xl transition-all"
                            >
                              Start Again
                            </button>
                          </div>
                        </div>
                        <CodeBlock title="Timer Package" subtitle="Save to /config/packages/" code={state.yaml.package} filename={`${state.customEntityId.split('.')[1] || 'timer'}.yaml`} stepNumber={1} />
                        <CodeBlock title="Dashboard UI" subtitle="Add to Dashboard" code={state.yaml.dashboard} filename="timer_ui.yaml" stepNumber={2} />
                        
                        <div className="pt-8 text-center">
                          <button 
                            onClick={() => dispatch({ type: 'RESET_APP' })} 
                            className="text-slate-500 hover:text-white font-black uppercase italic text-xs tracking-widest transition-colors flex items-center gap-3 mx-auto"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            Back to Start
                          </button>
                        </div>
                     </div>
                   ) : (
                     <ConfigurationForm state={state} dispatch={dispatch} onGenerate={handleGenerate} />
                   )}
                 </>
               )}
             </div>
          </div>
        )}
      </main>
      <style>{`
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 32px; height: 32px; background: #4f46e5; border-radius: 50%; border: 4px solid white; cursor: pointer; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4f46e5; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
