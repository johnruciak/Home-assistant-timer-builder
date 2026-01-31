
import React, { useState, useRef, useEffect } from 'react';
import { analyzeImage, generateYaml } from './services/gemini';
import { DiscoveryResult, DiscoveredEntity } from './types';
import { CodeBlock } from './components/CodeBlock';

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [discovery, setDiscovery] = useState<DiscoveryResult | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<DiscoveredEntity | null>(null);
  const [customName, setCustomName] = useState('');
  const [customEntityId, setCustomEntityId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [yaml, setYaml] = useState<{ scripts: string; automations: string; helpers: string; dashboard: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [processingTime, setProcessingTime] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedFilenameIndex, setCopiedFilenameIndex] = useState<number | null>(null);
  
  const [duration, setDuration] = useState(30);
  const [includeSafety, setIncludeSafety] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const preventDefault = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('dragover', preventDefault);
    window.addEventListener('dragenter', preventDefault);
    window.addEventListener('dragleave', preventDefault);
    window.addEventListener('drop', preventDefault);
    return () => {
      window.removeEventListener('dragover', preventDefault);
      window.removeEventListener('dragenter', preventDefault);
      window.removeEventListener('dragleave', preventDefault);
      window.removeEventListener('drop', preventDefault);
    };
  }, []);

  useEffect(() => {
    let interval: number;
    if (analyzing || generating) {
      setProcessingTime(0);
      interval = window.setInterval(() => {
        setProcessingTime(prev => prev + 1);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [analyzing, generating]);

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImage(base64String);
        setDiscovery(null);
        setSelectedEntity(null);
        setYaml(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  useEffect(() => {
    if (image && !discovery && !analyzing && !error) {
      triggerDiscovery(image);
    }
  }, [image]);

  const handleSelectEntity = (entity: DiscoveredEntity) => {
    setSelectedEntity(entity);
    setCustomName(entity.name);
    setCustomEntityId(entity.entityId);
  };

  const triggerDiscovery = async (base64: string) => {
    setAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeImage(base64);
      setDiscovery(result);
      
      if (result.entities && result.entities.length === 1) {
        const entity = result.entities[0];
        setSelectedEntity(entity);
        setCustomName(entity.name);
        setCustomEntityId(entity.entityId);
      }
    } catch (err) {
      setError("AI was unable to map entities. Try a clearer screenshot.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedEntity) return;
    setGenerating(true);
    try {
      const result = await generateYaml({
        deviceName: customName,
        entityId: customEntityId,
        duration: duration,
        safety: includeSafety,
        helper: true
      });
      setYaml(result);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      setError("Failed to build YAML. Check entity ID format.");
    } finally {
      setGenerating(false);
    }
  };

  const resetApp = () => {
    setImage(null);
    setDiscovery(null);
    setSelectedEntity(null);
    setYaml(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyFilename = (filename: string, index: number) => {
    navigator.clipboard.writeText(filename);
    setCopiedFilenameIndex(index);
    setTimeout(() => setCopiedFilenameIndex(null), 2000);
  };

  const slug = customName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filenames = {
    helpers: `${slug}_timer_config-packages.yaml`,
    scripts: `${slug}_timer-scripts.yaml`,
    automations: `${slug}_timer-automations.yaml`
  };

  return (
    <div 
      className="min-h-screen bg-[#020617] font-sans text-slate-100 selection:bg-indigo-500/30"
      onDragOver={() => setIsDragging(true)}
      onDragLeave={(e) => e.relatedTarget === null && setIsDragging(false)}
      onDrop={onDrop}
    >
      {isDragging && (
        <div className="fixed inset-0 z-[100] bg-indigo-600/95 backdrop-blur-xl flex items-center justify-center border-[20px] border-dashed border-white/20 m-6 rounded-[4rem] animate-in fade-in duration-300 pointer-events-none">
          <div className="text-center text-white p-12">
            <h2 className="text-7xl font-black italic tracking-tighter mb-4 uppercase">Release to Scan</h2>
            <p className="text-3xl font-bold opacity-70">Detecting all switchable entities</p>
          </div>
        </div>
      )}

      <nav className="sticky top-0 z-40 bg-[#020617]/80 border-b border-slate-800/50 px-8 py-4 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={resetApp}>
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-indigo-500/20 shadow-xl">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <h1 className="font-black text-2xl text-white leading-none tracking-tighter italic">EntityTimer Pro</h1>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Modular HA Discovery</p>
            </div>
          </div>
          <button onClick={() => setShowGuide(true)} className="px-5 py-2.5 bg-white text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg hover:scale-105 active:scale-95">Installation Guide</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-16">
        {!image ? (
          <div className="max-w-4xl mx-auto text-center space-y-16 py-12">
            <header className="space-y-6">
              <h2 className="text-8xl font-black text-white tracking-tighter leading-[0.85] italic animate-in fade-in slide-in-from-top-4">
                Discover Entities.<br/>Modular <span className="text-indigo-500">YAML.</span>
              </h2>
              <p className="text-2xl text-slate-400 leading-relaxed font-medium max-w-2xl mx-auto">
                Snap your dashboard. We identify every controllable item and generate clean, modular sliders. You can use a full screenshot of your entire Home Assistant dashboard, or a cropped image just showing the switch you want to add a timer to. If a device is missing, ensure it is added to a card on your dashboard first. It's also helpful to make a note of your actual <b>Entity ID</b> (e.g., <code>switch.valve_1</code>) from Home Assistant to verify the AI's guess. Each entity has its own YAML files: see installation guide for more.
              </p>
            </header>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="group relative bg-slate-900 border-4 border-dashed border-slate-800 rounded-[4rem] py-32 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-500/5 transition-all duration-700 shadow-2xl shadow-black"
            >
              <input type="file" ref={fileInputRef} onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }} className="hidden" accept="image/*" />
              <div className="w-40 h-40 bg-slate-800 rounded-[3rem] flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-indigo-600 transition-all duration-700 shadow-xl group-hover:shadow-indigo-500/20">
                <svg className="w-20 h-20 text-indigo-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <p className="text-white font-black text-4xl uppercase tracking-tighter italic">Drop Screenshot to Scan</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
              <div className="bg-slate-900 p-4 rounded-[3rem] shadow-2xl border border-slate-800 ring-8 ring-indigo-500/5 overflow-hidden group">
                <div className="overflow-y-auto max-h-[70vh] rounded-[2rem] scrollbar-hide border border-slate-800">
                  <img src={image} className="w-full h-auto opacity-60 group-hover:opacity-100 transition-opacity duration-500" alt="Dashboard" />
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-10">
              {(analyzing || generating) ? (
                <div className="bg-indigo-600 rounded-[4rem] p-24 text-white shadow-2xl animate-in zoom-in-95 duration-500 flex flex-col items-center text-center space-y-10 overflow-hidden relative">
                  <div className="relative z-10">
                    <div className="w-48 h-48 border-[16px] border-indigo-400 border-t-white rounded-full animate-spin flex items-center justify-center">
                      <span className="text-4xl font-black italic">{(processingTime / 10).toFixed(1)}s</span>
                    </div>
                  </div>
                  <h3 className="text-5xl font-black mb-4 italic tracking-tighter">
                    {analyzing ? 'DISCOVERING ENTITIES...' : 'BUILDING MODULAR YAML...'}
                  </h3>
                </div>
              ) : discovery && !yaml ? (
                <div className="space-y-12 animate-in fade-in slide-in-from-right-12 duration-700">
                  {discovery.entities.length > 1 && (
                    <>
                      <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-b border-slate-800 pb-8">
                        <div>
                          <h3 className="text-6xl font-black text-white italic tracking-tighter leading-none">Choose Target</h3>
                          <p className="text-slate-400 mt-4 text-xl font-medium">Which entity needs a modular timer?</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:flex-row gap-6">
                        {discovery.entities.map((entity) => (
                          <div 
                            key={entity.entityId}
                            onClick={() => handleSelectEntity(entity)}
                            className={`group cursor-pointer p-8 rounded-[3rem] border-2 transition-all duration-300 relative overflow-hidden ${
                              selectedEntity?.entityId === entity.entityId 
                              ? 'border-indigo-600 bg-indigo-600/10 shadow-[0_20px_50px_-10px_rgba(79,70,229,0.3)] ring-4 ring-indigo-500/20' 
                              : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                            }`}
                          >
                            <h4 className="text-2xl font-black text-white italic leading-tight mb-2 tracking-tighter">{entity.name}</h4>
                            <code className="text-[10px] font-mono text-slate-500 truncate block bg-black/30 p-2 rounded-lg">{entity.entityId}</code>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {selectedEntity && (
                    <div className="bg-slate-900 border-2 border-indigo-600/30 rounded-[4rem] p-16 shadow-2xl animate-in slide-in-from-bottom-12 duration-500 space-y-12">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white font-black text-2xl italic">
                          {discovery.entities.length > 1 ? '2' : '1'}
                        </div>
                        <h3 className="text-5xl font-black text-white italic tracking-tighter">Configure & Confirm</h3>
                      </div>

                      <div className="bg-amber-500/10 border-2 border-amber-500/30 p-8 rounded-[2rem] flex gap-6 items-center ring-4 ring-amber-500/5">
                        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex-shrink-0 flex items-center justify-center text-slate-900">
                          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-amber-200 font-black uppercase tracking-widest text-xs mb-1 italic">Crucial Verification Step</p>
                          <p className="text-amber-100/70 text-sm font-medium leading-relaxed">
                            If the <b>Entity ID</b> below is wrong, the timer will fail in Home Assistant. Check your <b>Developer Tools > States</b> in HA to find your exact entity ID (e.g., <code>switch.backyard_valve</code>).
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-4">Display Name</label>
                          <input 
                            type="text" 
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            className="w-full bg-slate-800/50 border-2 border-slate-700 rounded-3xl px-8 py-5 text-xl font-bold text-white focus:border-indigo-500 transition-colors outline-none"
                            placeholder="Device Name"
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-4">Home Assistant Entity ID</label>
                          <div className="relative group">
                            <input 
                              type="text" 
                              value={customEntityId}
                              onChange={(e) => setCustomEntityId(e.target.value)}
                              className="w-full bg-slate-800/50 border-2 border-slate-700 rounded-3xl px-8 py-5 text-xl font-mono text-indigo-400 focus:border-indigo-500 transition-colors outline-none peer"
                              placeholder="switch.example_entity"
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 peer-focus:opacity-100 transition-opacity pointer-events-none">
                              <span className="bg-indigo-600 text-[10px] font-black uppercase tracking-tighter text-white px-2 py-1 rounded">Editing Target ID</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-12 bg-black/40 rounded-[4rem] shadow-inner text-center border border-white/5">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-8">Timer Duration (Minutes)</label>
                        <input 
                          type="range" min="1" max="240" value={duration} 
                          onChange={(e) => setDuration(parseInt(e.target.value))} 
                          className="w-full h-3 bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-600 mb-10" 
                        />
                        <div className="flex items-baseline justify-center gap-4">
                          <span className="text-[10rem] leading-none font-black text-indigo-500 italic tracking-tighter">{duration}</span>
                          <span className="text-3xl font-black text-slate-700 uppercase tracking-tighter">min</span>
                        </div>
                      </div>

                      <button 
                        onClick={handleGenerate} 
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-12 rounded-[4rem] shadow-2xl transition-all transform hover:scale-[1.02] active:scale-95 text-3xl uppercase tracking-widest italic"
                      >
                        GENERATE YAML
                      </button>
                    </div>
                  )}
                </div>
              ) : yaml && (
                <div ref={resultsRef} className="space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000 pb-32">
                  <div className="flex items-end justify-between px-6">
                    <h3 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">Modular File Logic</h3>
                    <button onClick={() => setYaml(null)} className="text-indigo-500 font-black uppercase text-xs tracking-widest hover:underline">Edit</button>
                  </div>
                  
                  <div className="bg-indigo-600/20 border-2 border-indigo-600/40 p-8 rounded-[3rem] space-y-4">
                    <h4 className="text-xl font-black italic text-indigo-400">Step 0: Global Setup (One-time)</h4>
                    <p className="text-slate-400 font-medium">Add these lines to your <code>configuration.yaml</code> using the <strong>File Editor</strong>:</p>
                    <pre className="bg-black/40 p-6 rounded-2xl font-mono text-indigo-300 text-sm">
{`homeassistant:
  packages: !include_dir_named packages/

automation: !include_dir_list automations/
script: !include_dir_list scripts/
scene: !include_dir_list scenes/`}
                    </pre>
                  </div>

                  <div className="grid gap-10">
                    <CodeBlock title="Block 1: Helpers (Package)" code={yaml.helpers} filename={filenames.helpers} />
                    <CodeBlock title="Block 2: Script File" code={yaml.scripts} filename={filenames.scripts} />
                    <CodeBlock title="Block 3: Automation File" code={yaml.automations} filename={filenames.automations} />
                    <CodeBlock title="Block 4: Manual Card" code={yaml.dashboard} filename="Manual Card Editor" />
                  </div>
                  
                  <div className="bg-white rounded-[4rem] p-16 text-slate-900 shadow-2xl">
                    <h4 className="text-4xl font-black mb-8 italic">Deployment Checklist:</h4>
                    <ul className="space-y-8">
                      <li className="flex gap-6">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex-shrink-0 flex items-center justify-center text-white font-black">1</div>
                        <div className="space-y-4 flex-grow">
                          <div>
                            <p className="font-black text-xl italic uppercase tracking-tighter">Create configuration package</p>
                            <p className="text-slate-500 font-medium">Create a new file in File Editor in folder <b>packages</b>:</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="group relative flex-grow">
                              <code className="bg-slate-100 px-4 py-3 rounded-xl font-mono text-indigo-600 text-sm border border-slate-200 select-all block w-full pr-12 transition-all hover:border-indigo-300">
                                {filenames.helpers}
                              </code>
                              <button 
                                onClick={() => copyFilename(filenames.helpers, 1)} 
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                                title="Copy Filename"
                              >
                                {copiedFilenameIndex === 1 ? (
                                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                )}
                              </button>
                            </div>
                            <button onClick={() => copyToClipboard(yaml.helpers, 1)} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-slate-600 font-bold text-xs uppercase tracking-widest min-w-[100px]">{copiedIndex === 1 ? 'Copied' : 'Copy Code'}</button>
                            <button onClick={() => downloadFile(filenames.helpers, yaml.helpers)} className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-bold text-xs uppercase tracking-widest min-w-[100px]">Download</button>
                          </div>
                        </div>
                      </li>
                      <li className="flex gap-6">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex-shrink-0 flex items-center justify-center text-white font-black">2</div>
                        <div className="space-y-4 flex-grow">
                          <div>
                            <p className="font-black text-xl italic uppercase tracking-tighter">Create script file</p>
                            <p className="text-slate-500 font-medium">Create a new file in File Editor in folder <b>scripts</b>:</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="group relative flex-grow">
                              <code className="bg-slate-100 px-4 py-3 rounded-xl font-mono text-indigo-600 text-sm border border-slate-200 select-all block w-full pr-12 transition-all hover:border-indigo-300">
                                {filenames.scripts}
                              </code>
                              <button 
                                onClick={() => copyFilename(filenames.scripts, 2)} 
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                                title="Copy Filename"
                              >
                                {copiedFilenameIndex === 2 ? (
                                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                )}
                              </button>
                            </div>
                            <button onClick={() => copyToClipboard(yaml.scripts, 2)} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-slate-600 font-bold text-xs uppercase tracking-widest min-w-[100px]">{copiedIndex === 2 ? 'Copied' : 'Copy Code'}</button>
                            <button onClick={() => downloadFile(filenames.scripts, yaml.scripts)} className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-bold text-xs uppercase tracking-widest min-w-[100px]">Download</button>
                          </div>
                        </div>
                      </li>
                      <li className="flex gap-6">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex-shrink-0 flex items-center justify-center text-white font-black">3</div>
                        <div className="space-y-4 flex-grow">
                          <div>
                            <p className="font-black text-xl italic uppercase tracking-tighter">Create automation file</p>
                            <p className="text-slate-500 font-medium">Create a new file in File Editor in folder <b>automations</b>:</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="group relative flex-grow">
                              <code className="bg-slate-100 px-4 py-3 rounded-xl font-mono text-indigo-600 text-sm border border-slate-200 select-all block w-full pr-12 transition-all hover:border-indigo-300">
                                {filenames.automations}
                              </code>
                              <button 
                                onClick={() => copyFilename(filenames.automations, 3)} 
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                                title="Copy Filename"
                              >
                                {copiedFilenameIndex === 3 ? (
                                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                )}
                              </button>
                            </div>
                            <button onClick={() => copyToClipboard(yaml.automations, 3)} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-slate-600 font-bold text-xs uppercase tracking-widest min-w-[100px]">{copiedIndex === 3 ? 'Copied' : 'Copy Code'}</button>
                            <button onClick={() => downloadFile(filenames.automations, yaml.automations)} className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-bold text-xs uppercase tracking-widest min-w-[100px]">Download</button>
                          </div>
                        </div>
                      </li>
                      <li className="flex gap-6 pt-6 border-t border-slate-100">
                        <div className="w-12 h-12 bg-slate-200 rounded-2xl flex-shrink-0 flex items-center justify-center text-slate-600 font-black">4</div>
                        <div className="space-y-2">
                          <p className="font-black text-xl italic uppercase tracking-tighter">Final Step</p>
                          <p className="text-slate-500 font-medium leading-relaxed">Paste the manual card YAML into your dashboard and <b>Reload YAML</b> in <b>Developer Tools > YAML</b> for each domain (scripts, automations, and packages).</p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div className="flex justify-center pt-8">
                    <button 
                      onClick={resetApp}
                      className="group flex items-center gap-4 px-12 py-8 bg-slate-900 border-2 border-slate-800 text-slate-400 font-black rounded-[3rem] hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all duration-300 uppercase tracking-widest italic text-xl shadow-2xl"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Start New Scan
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#0f172a] w-full max-w-4xl rounded-[5rem] shadow-2xl overflow-hidden border border-slate-800">
            <div className="bg-indigo-600 p-16 text-white flex items-center justify-between">
              <h3 className="text-5xl font-black italic tracking-tighter uppercase">Modular Setup Guide</h3>
              <button onClick={() => setShowGuide(false)} className="bg-white/10 p-5 rounded-full hover:bg-white/20 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-20 space-y-12">
              <div className="space-y-6">
                <h4 className="text-3xl font-black text-white italic">Why modular?</h4>
                <p className="text-slate-400 text-xl font-medium leading-relaxed">
                  Modifying <code>configuration.yaml</code> for every single timer is messy. By using <code>!include</code> directives, you create dedicated folders. To add a new timer, you just drop 3 files into their folders and you're done!
                </p>
              </div>

              <div className="space-y-6 border-t border-slate-800 pt-10">
                <h4 className="text-2xl font-black text-white italic">Prerequisites:</h4>
                <ul className="list-disc list-inside text-slate-400 text-lg space-y-2">
                  <li>Install the <strong>File Editor</strong> add-on.</li>
                  <li>In your config directory, create folders: <code>packages</code>, <code>automations</code>, <code>scripts</code>, and <code>scenes</code>.</li>
                </ul>
              </div>

              <div className="bg-black/40 p-8 rounded-3xl border border-white/5">
                <p className="text-indigo-400 font-black mb-4 uppercase tracking-widest text-xs">Required in configuration.yaml:</p>
                <code className="text-indigo-300 block">homeassistant: &#123; packages: !include_dir_named packages/ &#125;</code>
                <code className="text-indigo-300 block">automation: !include_dir_list automations/</code>
                <code className="text-indigo-300 block">script: !include_dir_list scripts/</code>
                <code className="text-indigo-300 block">scene: !include_dir_list scenes/</code>
              </div>
              <button onClick={() => setShowGuide(false)} className="w-full bg-white text-slate-900 font-black py-8 rounded-[3rem] hover:bg-slate-200 transition-all uppercase tracking-widest italic shadow-2xl">Got it!</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
