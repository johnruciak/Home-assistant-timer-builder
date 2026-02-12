
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { analyzeImage, generateYaml } from './services/gemini';
import { DiscoveryResult, DiscoveredEntity } from './types';
import { CodeBlock } from './components/CodeBlock';

const App: React.FC = () => {
  const [isKeyConfigured, setIsKeyConfigured] = useState<boolean | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [analysing, setAnalyzing] = useState(false);
  const [discovery, setDiscovery] = useState<DiscoveryResult | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<DiscoveredEntity | null>(null);
  const [customName, setCustomName] = useState('');
  const [customEntityId, setCustomEntityId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [yaml, setYaml] = useState<{ package: string; dashboard: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showListManager, setShowListManager] = useState(false);
  const [listManagerTab, setListManagerTab] = useState<'card' | 'json' | 'manual'>('card');
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingJson, setIsDraggingJson] = useState(false);
  const [processingTime, setProcessingTime] = useState(0);
  
  const [duration, setDuration] = useState(30);
  const [includeSafety, setIncludeSafety] = useState(true);
  const [preWarning, setPreWarning] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<'none' | 'time' | 'sunset' | 'sunrise'>('none');
  const [scheduleTime, setScheduleTime] = useState('20:00');

  const [manualInput, setManualInput] = useState('');
  const [showManualInputForm, setShowManualInputForm] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setIsKeyConfigured(hasKey);
    };
    checkKey();
  }, []);

  const handleActivate = async () => {
    // @ts-ignore
    await window.aistudio.openSelectKey();
    setIsKeyConfigured(true);
  };

  const handleError = (err: any) => {
    if (err?.message?.includes('Requested entity was not found')) {
      setIsKeyConfigured(false);
      setError("API Key verification failed. Please select a valid key from a paid project.");
    } else {
      setError(err?.message || "An unexpected system error occurred.");
    }
  };

  const EXPORTER_CARD_REPO = "https://github.com/scharc/ha-entity-exporter-card";
  const EXPORTER_CARD_YAML = `type: custom:entity-exporter-card
name: Sync to EntityTimer`;

  const [rawEntityList, setRawEntityList] = useState<string>(() => localStorage.getItem('ha_entity_list') || '');
  
  const TIMER_TARGET_DOMAINS = ['switch', 'light', 'valve', 'fan', 'climate', 'media_player', 'cover', 'vacuum'];
  const LIBRARY_DOMAINS = [...TIMER_TARGET_DOMAINS, 'binary_sensor', 'sensor', 'input_boolean'];
  
  const ENTITY_REGEX_G = new RegExp(`\\b(${LIBRARY_DOMAINS.join('|')})\\.[a-z0-9_]+\\b`, 'gi');
  const ENTITY_REGEX_VALIDATE = new RegExp(`^(${LIBRARY_DOMAINS.join('|')})\\.[a-z0-9_]+$`, 'i');

  const getGroupForEntityId = (id: string): string => {
    if (!id || !id.includes('.')) return 'Other';
    const domain = id.split('.')[0].toLowerCase();
    const rest = id.split('.')[1].toLowerCase();
    if (domain === 'valve' || rest.includes('swv') || rest.includes('valve')) return 'Valves';
    if (domain === 'switch') return 'Switches';
    if (domain === 'light') return 'Lights';
    if (domain === 'climate') return 'Climate';
    if (domain === 'fan') return 'Fans';
    if (domain === 'media_player') return 'Media';
    if (domain === 'vacuum') return 'Cleaning';
    if (domain === 'cover') return 'Covers';
    if (domain === 'binary_sensor' || domain === 'sensor') return 'Sensors';
    return 'Other';
  };

  const handleMagicExtract = (inputText?: string) => {
    const text = inputText ?? rawEntityList;
    if (!text.trim()) return;
    try {
      const parsed = JSON.parse(text);
      let candidates: string[] = [];
      if (Array.isArray(parsed)) {
        candidates = parsed.map(item => item.entity_id).filter(id => typeof id === 'string');
      } else if (typeof parsed === 'object' && parsed !== null) {
        candidates = Object.keys(parsed);
      }
      if (candidates.length > 0) {
        const filtered = candidates.filter(k => ENTITY_REGEX_VALIDATE.test(k));
        if (filtered.length > 0) {
          const unique = Array.from(new Set(filtered.map(m => m.toLowerCase()))).sort();
          setRawEntityList(unique.join('\n'));
          return;
        }
      }
    } catch (e) {}
    const matches = text.match(ENTITY_REGEX_G);
    if (matches) {
      const unique = Array.from(new Set(matches.map(m => m.toLowerCase()))).sort();
      setRawEntityList(unique.join('\n'));
    }
  };

  const handleClearLibrary = () => {
    if (window.confirm("Are you sure?")) {
      setRawEntityList('');
      localStorage.removeItem('ha_entity_list');
    }
  };

  const handleJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => handleMagicExtract(event.target?.result as string);
      reader.readAsText(file);
    }
  };

  const handleJsonDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDraggingJson(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => handleMagicExtract(event.target?.result as string);
      reader.readAsText(file);
    }
  };

  const masterEntities = useMemo(() => {
    const matches = rawEntityList.match(ENTITY_REGEX_G);
    if (!matches) return [];
    return Array.from(new Set(matches.map(m => m.toLowerCase()))).sort();
  }, [rawEntityList]);

  const masterTargetEntities = useMemo(() => {
    return masterEntities.filter(id => TIMER_TARGET_DOMAINS.includes(id.split('.')[0]));
  }, [masterEntities]);

  const [quickSearch, setQuickSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('ha_entity_list', rawEntityList);
  }, [rawEntityList]);

  useEffect(() => {
    let interval: number;
    if (analysing || generating) {
      setProcessingTime(0);
      interval = window.setInterval(() => setProcessingTime(prev => prev + 1), 100);
    }
    return () => clearInterval(interval);
  }, [analysing, generating]);

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImage(base64); setDiscovery(null); setSelectedEntity(null); setYaml(null); setError(null);
        triggerDiscovery(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerDiscovery = async (base64: string) => {
    if (base64 === 'DIRECT_SELECTION') return;
    setAnalyzing(true); setError(null);
    try {
      const result = await analyzeImage(base64);
      result.entities = result.entities.filter(ent => TIMER_TARGET_DOMAINS.includes(ent.entityId.split('.')[0]));
      setDiscovery(result);
      if (result.entities && result.entities.length === 1) handleSelectEntity(result.entities[0]);
    } catch (err) { handleError(err); } finally { setAnalyzing(false); }
  };

  const handleSelectEntity = (entity: DiscoveredEntity) => {
    setSelectedEntity(entity); setCustomName(entity.name); setCustomEntityId(entity.entityId);
  };

  const handleQuickSelect = (entityId: string) => {
    const group = getGroupForEntityId(entityId);
    const name = entityId.split('.')[1].replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    setCustomEntityId(entityId); setCustomName(name); setImage('DIRECT_SELECTION');
    setDiscovery({ entities: [], explanation: 'Direct setup.' });
    setSelectedEntity({ entityId, name, type: 'switch' });
    setShowListManager(false);
  };

  const handleManualEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.includes('.')) handleQuickSelect(manualInput.trim());
  };

  const handleGenerate = async () => {
    if (!customEntityId) return;
    setGenerating(true);
    try {
      // Fix: Added missing 'helper' property to generateYaml call
      const result = await generateYaml({
        deviceName: customName, 
        entityId: customEntityId, 
        duration: duration, 
        safety: includeSafety,
        helper: true, 
        preWarning: preWarning, 
        scheduleMode: scheduleMode, 
        scheduleTime: scheduleTime
      });
      setYaml(result);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) { handleError(err); } finally { setGenerating(false); }
  };

  const resetApp = () => {
    setImage(null); setDiscovery(null); setSelectedEntity(null); setYaml(null); setError(null);
    setShowManualInputForm(false); setScheduleMode('none'); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const slug = useMemo(() => {
    if (!customEntityId) return 'entity';
    return customEntityId.split('.')[1].toLowerCase().replace(/[^a-z0-9]/g, '_');
  }, [customEntityId]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const getEntityIcon = (id: string) => {
    const group = getGroupForEntityId(id);
    switch(group) {
      case 'Valves': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.022.547l-2.387 2.387a2 2 0 102.828 2.828l3.362-3.361a4 4 0 012.58-.344l.318-.158a4 4 0 012.58-.344l3.362 3.361a2 2 0 102.828-2.828l-2.387-2.387z" />;
      case 'Lights': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.364-6.364l-.707-.707M6.736 14h10.528A5.002 5.002 0 0112 19a5.002 5.002 0 01-4.736-5z" />;
      default: return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />;
    }
  };

  if (isKeyConfigured === false) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-8">
        <div className="max-w-2xl w-full bg-slate-900 border-2 border-indigo-600/30 rounded-[4rem] p-16 text-center space-y-10 shadow-3xl">
          <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-2xl">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">Activation Required</h2>
          <button onClick={handleActivate} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-8 rounded-3xl text-xl uppercase italic">ACTIVATE SYSTEM</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] font-sans text-slate-100 overflow-x-hidden" onDragOver={() => setIsDragging(true)} onDragLeave={(e) => e.relatedTarget === null && setIsDragging(false)} onDrop={onDrop}>
      {/* GUIDE MODAL */}
      {showGuide && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowGuide(false)} />
          <div className="relative bg-slate-900 border-2 border-indigo-500/30 rounded-[3rem] p-12 max-w-2xl w-full space-y-8 animate-in zoom-in-95">
             <h2 className="text-4xl font-black italic tracking-tighter uppercase text-white">Recommended Setup</h2>
             <p className="text-slate-400">To fix "Timeout" errors and keep your visual editors working, use this configuration in your <code>configuration.yaml</code>:</p>
             <pre className="bg-black/50 p-6 rounded-2xl text-xs font-mono text-indigo-300 border border-white/5">{`homeassistant:
  packages: !include_dir_named packages/

# Keep these so your UI editors still work!
automation: !include automations.yaml
script: !include scripts.yaml
scene: !include scenes.yaml`}</pre>
             <button onClick={() => setShowGuide(false)} className="w-full py-4 bg-indigo-600 rounded-2xl font-black uppercase tracking-widest italic">GOT IT</button>
          </div>
        </div>
      )}

      {/* ENTITY LIBRARY MODAL */}
      {showListManager && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl" onClick={() => setShowListManager(false)} />
          <div className="relative bg-slate-900 border-4 border-indigo-600/30 rounded-[3.5rem] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-3xl animate-in zoom-in-95" onDragOver={(e) => { e.preventDefault(); setIsDraggingJson(true); }} onDragLeave={() => setIsDraggingJson(false)} onDrop={handleJsonDrop}>
            <div className="px-12 py-10 border-b border-white/5 flex items-center justify-between shrink-0">
              <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">Entity Library</h2>
              <button onClick={() => setShowListManager(false)} className="p-4 bg-slate-800 hover:bg-red-600 transition-colors rounded-2xl text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="flex-grow overflow-hidden flex flex-col md:flex-row">
              <div className="w-full md:w-64 bg-black/20 border-r border-white/5 p-6 space-y-3 shrink-0">
                <button onClick={() => setListManagerTab('json')} className={`w-full text-left px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest ${listManagerTab === 'json' ? 'bg-indigo-600' : 'text-slate-500'}`}>Import JSON</button>
                <button onClick={() => setListManagerTab('manual')} className={`w-full text-left px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest ${listManagerTab === 'manual' ? 'bg-indigo-600' : 'text-slate-500'}`}>Manual List</button>
                <button onClick={handleClearLibrary} className="w-full text-left px-6 py-4 rounded-2xl text-[10px] font-black uppercase text-red-500 italic mt-auto">Clear All</button>
              </div>
              <div className="flex-grow overflow-y-auto p-12 custom-scrollbar">
                {listManagerTab === 'json' ? (
                   <div className="border-4 border-dashed border-slate-800 rounded-[3rem] p-16 flex flex-col items-center justify-center text-center hover:border-indigo-600 hover:bg-indigo-600/5 transition-all cursor-pointer" onClick={() => document.getElementById('json-upload')?.click()}>
                     <input id="json-upload" type="file" className="hidden" accept=".json" onChange={handleJsonFileUpload} />
                     <p className="text-white font-black text-2xl uppercase italic">Select JSON File</p>
                   </div>
                ) : (
                   <textarea placeholder="Paste IDs here..." value={rawEntityList} onChange={(e) => setRawEntityList(e.target.value)} className="w-full min-h-[300px] bg-black/40 border-2 border-slate-800 rounded-3xl p-8 text-sm font-mono text-indigo-200" />
                )}
                {masterTargetEntities.length > 0 && (
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                     {masterTargetEntities.map(id => (
                       <button key={id} onClick={() => handleQuickSelect(id)} className="group bg-slate-800/40 hover:bg-indigo-600 border-2 border-slate-800 p-5 rounded-[1.5rem] flex items-center gap-4 transition-all text-left">
                          <svg className="w-5 h-5 text-indigo-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">{getEntityIcon(id)}</svg>
                          <div className="min-w-0">
                            <p className="text-white font-black uppercase text-[10px] truncate italic">{id.split('.')[1]}</p>
                            <code className="text-[8px] text-slate-500 group-hover:text-indigo-200 truncate block">{id}</code>
                          </div>
                       </button>
                     ))}
                   </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="sticky top-0 z-40 bg-[#020617]/80 border-b border-slate-800/50 px-8 py-4 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={resetApp}>
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
            <h1 className="font-black text-2xl text-white tracking-tighter italic">EntityTimer</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowListManager(true)} className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase italic">Library ({masterTargetEntities.length})</button>
            <button onClick={() => setShowGuide(true)} className="px-5 py-2.5 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase italic">Setup Help</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-16">
        {!image ? (
          <div className="space-y-16 py-12 text-center">
            <h2 className="text-8xl font-black text-white tracking-tighter leading-[0.85] italic">Add a Timer to<br/>Any <span className="text-indigo-500">Device.</span></h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div onClick={() => setShowManualInputForm(true)} className="bg-slate-900 border-4 border-slate-800 rounded-[4rem] p-10 h-[400px] flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500">
                 <p className="text-white font-black text-3xl uppercase italic">Manual Entry</p>
              </div>
              <div onClick={() => setShowListManager(true)} className="bg-slate-900 border-4 border-slate-800 rounded-[4rem] p-10 h-[400px] flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500">
                 <p className="text-white font-black text-3xl uppercase italic">From Library</p>
              </div>
              <div onClick={() => fileInputRef.current?.click()} className="bg-slate-900 border-4 border-dashed border-slate-800 rounded-[4rem] p-10 h-[400px] flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500">
                 <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && handleFile(e.target.files[0])} className="hidden" accept="image/*" />
                 <p className="text-white font-black text-3xl uppercase italic">Scan Screen</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
             <div className="lg:col-span-4 sticky top-28">
               <div className="bg-slate-900 p-4 rounded-[3rem] border border-slate-800 overflow-hidden">
                 {image === 'DIRECT_SELECTION' ? <div className="aspect-video bg-indigo-900/30 flex items-center justify-center text-white italic">DIRECT ENTRY ACTIVE</div> : <img src={image} className="w-full opacity-70" />}
               </div>
             </div>

             <div className="lg:col-span-8 space-y-12">
               {generating ? (
                 <div className="bg-indigo-600 rounded-[4rem] p-24 text-center text-white italic text-4xl font-black">Building Package...</div>
               ) : yaml ? (
                 <div ref={resultsRef} className="space-y-12 animate-in slide-in-from-bottom-12 pb-32">
                   <div className="flex justify-between items-end px-8">
                     <h3 className="text-6xl font-black text-white italic tracking-tighter uppercase">Timer Output</h3>
                     <button onClick={() => setYaml(null)} className="text-indigo-400 font-black uppercase text-xs">Back</button>
                   </div>
                   
                   <div className="bg-amber-600/10 border-2 border-amber-600/30 p-10 rounded-[4rem] flex gap-8 mx-8">
                     <div className="w-16 h-16 bg-amber-600 rounded-3xl flex items-center justify-center shrink-0 text-white font-black">!</div>
                     <div>
                       <h4 className="text-amber-400 font-black uppercase text-xs italic mb-2">How to Use: All-in-One Package</h4>
                       <p className="text-amber-100/70 text-sm font-bold italic leading-relaxed">
                         Create a new file called <code>{slug}_timer.yaml</code> in your <code>/config/packages/</code> folder and paste the code below. Then, reload your YAML and add the card.
                       </p>
                     </div>
                   </div>

                   <CodeBlock title="Timer Package" subtitle="Save to /config/packages/" code={yaml.package} filename={`${slug}_timer.yaml`} stepNumber={1} />
                   <CodeBlock title="Dashboard UI" subtitle="Add to Dashboard" code={yaml.dashboard} filename="timer_ui.yaml" stepNumber={2} />
                 </div>
               ) : discovery && (
                 <div className="bg-slate-900/80 border-2 border-indigo-600/30 rounded-[4rem] p-16 space-y-12">
                   <h3 className="text-5xl font-black italic uppercase">Timer Settings</h3>
                   <div className="grid grid-cols-2 gap-10">
                     <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} className="w-full bg-slate-800 border-2 border-slate-700 rounded-3xl px-8 py-6 text-xl text-white outline-none" placeholder="Name" />
                     <input type="text" value={customEntityId} onChange={(e) => setCustomEntityId(e.target.value)} className="w-full bg-slate-800 border-2 border-slate-700 rounded-3xl px-8 py-6 text-xl text-indigo-400 font-mono" placeholder="Entity ID" />
                   </div>
                   <div className="p-16 bg-black/40 rounded-[4rem] text-center space-y-10">
                     <p className="text-slate-500 uppercase tracking-widest text-xs font-black">Auto-Off Duration</p>
                     <input type="range" min="1" max="240" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} className="w-full h-3 bg-slate-800 rounded-full appearance-none accent-indigo-600" />
                     <div className="text-[8rem] font-black text-indigo-500 italic tracking-tighter leading-none">{duration}<span className="text-2xl ml-4">min</span></div>
                   </div>
                   <button onClick={handleGenerate} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-12 rounded-[4rem] text-4xl uppercase italic">GENERATE TIMER</button>
                 </div>
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
