
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
  const [yaml, setYaml] = useState<{ scripts: string; automations: string; helpers: string; dashboard: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showPrerequisites, setShowPrerequisites] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [showListManager, setShowListManager] = useState(false);
  const [listManagerTab, setListManagerTab] = useState<'card' | 'manual'>('card');
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingJson, setIsDraggingJson] = useState(false);
  const [processingTime, setProcessingTime] = useState(0);
  const [copiedStep0, setCopiedStep0] = useState(false);
  
  const [duration, setDuration] = useState(30);
  const [includeSafety, setIncludeSafety] = useState(true);
  const [includeFade, setIncludeFade] = useState(true);
  
  const [presenceSensor, setPresenceSensor] = useState('');
  const [preWarning, setPreWarning] = useState(false);
  const [usePresets, setUsePresets] = useState(true);
  const [sunsetOnly, setSunsetOnly] = useState(false);

  const [targetTemp, setTargetTemp] = useState(21);
  const [hvacMode, setHvacMode] = useState<'cool' | 'heat' | 'auto'>('cool');

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
name: Sync to EntityTimer
# This card helps you export IDs for the timer generator.`;

  const STEP0_YAML = `homeassistant:
  packages: !include_dir_named packages/

automation: !include_dir_list automations/
script: !include_dir_list scripts/
scene: !include_dir_list scenes/`;

  const [rawEntityList, setRawEntityList] = useState<string>(() => localStorage.getItem('ha_entity_list') || '');
  
  const TIMER_TARGET_DOMAINS = ['switch', 'light', 'valve', 'fan', 'climate', 'media_player', 'cover', 'vacuum'];
  const ENTITY_REGEX_G = new RegExp(`\\b(${TIMER_TARGET_DOMAINS.join('|')})\\.[a-z0-9_]+\\b`, 'gi');
  const ENTITY_REGEX_VALIDATE = new RegExp(`^(${TIMER_TARGET_DOMAINS.join('|')})\\.[a-z0-9_]+$`, 'i');

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
    if (window.confirm("Are you sure you want to clear your entire entity library? This cannot be undone.")) {
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
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingJson(false);
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

  const [quickSearch, setQuickSearch] = useState('');

  const groupedEntities = useMemo(() => {
    const term = quickSearch.trim().toLowerCase();
    const filtered = term 
      ? masterEntities.filter(id => {
          const friendlyName = id.split('.')[1]?.replace(/_/g, ' ').toLowerCase() || '';
          return id.toLowerCase().includes(term) || friendlyName.includes(term);
        })
      : masterEntities;

    const groups: Record<string, string[]> = {};
    filtered.forEach(id => {
      const g = getGroupForEntityId(id);
      if (!groups[g]) groups[g] = [];
      groups[g].push(id);
    });

    const order = ['Valves', 'Climate', 'Lights', 'Switches', 'Fans', 'Cleaning', 'Media', 'Covers', 'Other'];
    const sortedGroups: Array<{ name: string, items: string[] }> = [];
    order.forEach(name => {
      if (groups[name]) sortedGroups.push({ name, items: groups[name] });
    });
    
    return sortedGroups;
  }, [quickSearch, masterEntities]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('ha_entity_list', rawEntityList);
  }, [rawEntityList]);

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
        setImage(base64);
        setDiscovery(null);
        setSelectedEntity(null);
        setYaml(null);
        setError(null);
        triggerDiscovery(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerDiscovery = async (base64: string) => {
    if (base64 === 'DIRECT_SELECTION') return;
    setAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeImage(base64);
      result.entities = result.entities.filter(ent => TIMER_TARGET_DOMAINS.includes(ent.entityId.split('.')[0]));
      setDiscovery(result);
      if (result.entities && result.entities.length === 1) {
        handleSelectEntity(result.entities[0]);
      }
    } catch (err) {
      handleError(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSelectEntity = (entity: DiscoveredEntity) => {
    setSelectedEntity(entity);
    setCustomName(entity.name);
    setCustomEntityId(entity.entityId);
  };

  const handleQuickSelect = (entityId: string) => {
    const group = getGroupForEntityId(entityId);
    const name = entityId.split('.')[1]
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    const inferType = (): any => {
      if (group === 'Valves') return 'valve';
      if (group === 'Lights') return 'light';
      if (group === 'Climate') return 'climate';
      if (group === 'Fans') return 'fan';
      if (group === 'Cleaning') return 'vacuum';
      if (group === 'Media') return 'media_player';
      return 'switch';
    };

    setCustomEntityId(entityId);
    setCustomName(name);
    setImage('DIRECT_SELECTION'); 
    setDiscovery({ entities: [], explanation: 'Direct input setup.' });
    setSelectedEntity({ entityId, name, type: inferType() });
  };

  const handleManualEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.includes('.')) return;
    handleQuickSelect(manualInput.trim());
  };

  const handlePasteId = async () => {
    setError(null);
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      setError("Clipboard access blocked. Please paste manually.");
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.includes('.')) setCustomEntityId(text.trim());
    } catch (err) {
      setError("Permission denied. Use Ctrl+V.");
    }
  };

  const handleGenerate = async () => {
    if (!customEntityId) return;
    setGenerating(true);
    try {
      const result = await generateYaml({
        deviceName: customName,
        entityId: customEntityId,
        duration: duration,
        safety: includeSafety,
        fade: customEntityId.startsWith('light.') ? includeFade : false,
        helper: true,
        targetTemp: selectedEntity?.type === 'climate' ? targetTemp : undefined,
        hvacMode: selectedEntity?.type === 'climate' ? hvacMode : undefined,
        presenceSensor: presenceSensor,
        preWarning: preWarning,
        presets: usePresets,
        sunsetOnly: sunsetOnly
      });
      setYaml(result);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      handleError(err);
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
    setQuickSearch('');
    setManualInput('');
    setShowManualInputForm(false);
    setPresenceSensor('');
    setPreWarning(false);
    setUsePresets(true);
    setSunsetOnly(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const slug = useMemo(() => {
    if (!customEntityId) return 'entity';
    const technicalIdOnly = customEntityId.includes('.') ? customEntityId.split('.')[1] : customEntityId;
    return technicalIdOnly.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }, [customEntityId]);

  const filenames = useMemo(() => ({
    helpers: `${slug}_timer_config_packages.yaml`,
    scripts: `${slug}_timer_scripts.yaml`,
    automations: `${slug}_timer_automations.yaml`
  }), [slug]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleCopyStep0 = () => {
    navigator.clipboard.writeText(STEP0_YAML);
    setCopiedStep0(true);
    setTimeout(() => setCopiedStep0(false), 2000);
  };

  const handleCopyRepoUrl = () => {
    navigator.clipboard.writeText("https://github.com/johnruciak/Home-assistant-timer-builder/");
  };

  const handleCopyCardYaml = () => {
    navigator.clipboard.writeText(EXPORTER_CARD_YAML);
  };

  const getEntityIcon = (id: string) => {
    const group = getGroupForEntityId(id);
    switch(group) {
      case 'Valves': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.022.547l-2.387 2.387a2 2 0 102.828 2.828l3.362-3.361a4 4 0 012.58-.344l.318-.158a4 4 0 012.58-.344l3.362 3.361a2 2 0 102.828-2.828l-2.387-2.387z" />;
      case 'Lights': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.364-6.364l-.707-.707M6.736 14h10.528A5.002 5.002 0 0112 19a5.002 5.002 0 01-4.736-5z" />;
      case 'Switches': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />;
      case 'Climate': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />;
      case 'Fans': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75-4.365-9.75-9.75-9.75zM12 15a3 3 0 110-6 3 3 0 010 6z" />;
      case 'Cleaning': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />;
      default: return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />;
    }
  };

  if (isKeyConfigured === false) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-8 selection:bg-indigo-500/30">
        <div className="max-w-2xl w-full bg-slate-900 border-2 border-indigo-600/30 rounded-[4rem] p-16 text-center space-y-10 shadow-3xl animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-indigo-500/20">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <div className="space-y-4">
            <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-tight">System Activation</h2>
            <p className="text-slate-400 text-xl font-medium italic leading-relaxed">
              This is a <span className="text-indigo-400">Bring Your Own Key</span> application. 
              We don't store your secrets. To use the AI Discovery engine, connect your Google Gemini API Key.
            </p>
          </div>
          <div className="p-8 bg-black/40 rounded-3xl text-left border border-white/5 space-y-4">
            <h4 className="text-indigo-400 font-black text-xs uppercase tracking-widest italic">How it works:</h4>
            <ul className="text-slate-400 text-sm space-y-3 font-medium">
              <li className="flex gap-3"><span className="text-indigo-500 font-bold">1.</span> Key stays in your browser (LocalStorage).</li>
              <li className="flex gap-3"><span className="text-indigo-500 font-bold">2.</span> Works with Free or Paid Google Cloud projects.</li>
              <li className="flex gap-3"><span className="text-indigo-500 font-bold">3.</span> Vision models require billing enabled on Google Cloud.</li>
            </ul>
          </div>
          <button 
            onClick={handleActivate} 
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-8 rounded-3xl text-xl uppercase tracking-widest transition-all shadow-2xl shadow-indigo-600/20 active:scale-95 italic border border-white/10"
          >
            ACTIVATE SYSTEM
          </button>
          <p className="text-slate-500 text-xs">
            Visit <a href="https://aistudio.google.com/" target="_blank" className="text-indigo-400 underline hover:text-indigo-300">Google AI Studio</a> to generate a key.
          </p>
        </div>
      </div>
    );
  }

  if (isKeyConfigured === null) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] font-sans text-slate-100 selection:bg-indigo-500/30 overflow-x-hidden" onDragOver={() => setIsDragging(true)} onDragLeave={(e) => e.relatedTarget === null && setIsDragging(false)} onDrop={onDrop}>
      {isDragging && !showListManager && (
        <div className="fixed inset-0 z-[100] bg-indigo-600/95 backdrop-blur-xl flex items-center justify-center border-[20px] border-dashed border-white/20 m-6 rounded-[4rem] animate-in fade-in duration-300 pointer-events-none">
          <div className="text-center text-white p-12">
            <h2 className="text-7xl font-black italic tracking-tighter mb-4 uppercase">Release to Scan</h2>
            <p className="text-3xl font-bold opacity-70">Detecting controllable targets</p>
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
              <h1 className="font-black text-2xl text-white leading-none tracking-tighter italic">EntityTimer</h1>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Simple Timer Builder</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href="https://github.com/johnruciak/Home-assistant-timer-builder/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all italic border border-white/5 flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              Source Code
            </a>
            <button onClick={() => setShowPrerequisites(true)} className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all italic border border-white/5">Prerequisites</button>
            <button onClick={() => setShowFeatures(true)} className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all italic border border-white/5">Features</button>
            <button onClick={() => setShowListManager(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-slate-700 shadow-lg relative italic border border-white/5">
              My Entities {masterEntities.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-[8px] border-2 border-[#020617]">{masterEntities.length}</span>}
            </button>
            <button onClick={() => setShowGuide(true)} className="px-4 py-2 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg hover:scale-105 active:scale-95 italic">Setup Help</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-16">
        {error && (
          <div className="max-w-4xl mx-auto mb-12 animate-in slide-in-from-top-4 duration-500">
            <div className="bg-red-600/20 border-2 border-red-600 rounded-[2.5rem] p-6 flex items-center gap-6 backdrop-blur-md">
              <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
              <p className="text-red-200 font-bold italic tracking-tight leading-snug">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto p-2 text-red-400 hover:text-white transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
          </div>
        )}

        {!image ? (
          <div className="space-y-16 py-12">
            <header className="text-center space-y-6 max-w-4xl mx-auto">
              <h2 className="text-8xl font-black text-white tracking-tighter leading-[0.85] italic animate-in fade-in slide-in-from-top-4">
                Add a Timer to<br/>Any <span className="text-indigo-500">Device.</span>
              </h2>
              <p className="text-2xl text-slate-400 leading-relaxed font-medium">
                The easiest way to generate "Auto-Off" timers for your Home Assistant entities.
                Pick a device, set the time, and get the code.
              </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
              <div className="group relative bg-slate-900/40 border-4 border-slate-800 rounded-[4rem] p-10 flex flex-col items-center justify-center transition-all duration-700 shadow-2xl shadow-black h-full overflow-hidden hover:border-indigo-500/50">
                {!showManualInputForm ? (
                  <div className="flex flex-col items-center justify-center animate-in fade-in slide-in-from-left-4 duration-500 text-center" onClick={() => setShowManualInputForm(true)}>
                    <div className="w-24 h-24 bg-slate-800 rounded-[2.5rem] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-indigo-600 transition-all duration-700 shadow-xl group-hover:shadow-indigo-500/20 cursor-pointer">
                      <svg className="w-10 h-10 text-indigo-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002-2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </div>
                    <p className="text-white font-black text-3xl uppercase tracking-tighter italic cursor-pointer">Quick Entry</p>
                    <p className="text-slate-500 text-xs mt-4 font-bold uppercase tracking-widest cursor-pointer">Paste a Technical ID</p>
                  </div>
                ) : (
                  <form onSubmit={handleManualEntrySubmit} className="w-full space-y-8 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-indigo-400 font-black italic uppercase text-sm tracking-widest">Single Entity</h4>
                      <button type="button" onClick={() => setShowManualInputForm(false)} className="text-slate-500 hover:text-white transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Entity ID</label>
                      <input autoFocus type="text" placeholder="e.g. valve.garden_tap" value={manualInput} onChange={(e) => setManualInput(e.target.value)} className="w-full bg-slate-800/80 border-2 border-slate-700 rounded-3xl px-6 py-5 text-base font-mono text-white outline-none focus:border-indigo-500 transition-colors shadow-inner" />
                    </div>
                    <button type="submit" disabled={!manualInput.includes('.')} className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-3xl text-sm uppercase tracking-[0.3em] transition-all transform active:scale-95 shadow-xl shadow-indigo-600/20 italic">CONFIGURE</button>
                  </form>
                )}
              </div>

              <div className="h-full">
                {masterEntities.length > 0 ? (
                  <div className="bg-slate-900/60 rounded-[4rem] border-2 border-slate-800 p-8 flex flex-col h-[600px] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500 relative">
                    <div className="flex flex-col gap-6 mb-8">
                      <div className="flex items-center justify-between">
                        <h3 className="text-3xl font-black italic tracking-tighter text-white uppercase">Sync Library</h3>
                        <button onClick={() => setShowListManager(true)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-400 hover:text-indigo-400 transition-all shadow-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                      </div>
                      <div className="relative">
                        <input type="text" placeholder="Filter synced devices..." value={quickSearch} onChange={(e) => setQuickSearch(e.target.value)} className="w-full bg-slate-800/80 border-2 border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:border-indigo-500 transition-colors shadow-inner" />
                        <svg className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </div>
                    </div>
                    <div className="flex-grow overflow-y-auto pr-2 space-y-8 custom-scrollbar">
                      {groupedEntities.length > 0 ? groupedEntities.map(group => (
                        <div key={group.name} className="space-y-4">
                          <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] ml-2 italic">{group.name}</h4>
                          <div className="space-y-3">
                            {group.items.map(id => (
                              <button key={id} onClick={() => handleQuickSelect(id)} className="w-full group bg-slate-800/40 hover:bg-indigo-600 border-2 border-slate-800 hover:border-indigo-500 p-4 rounded-[1.5rem] flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-95 shadow-xl">
                                <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-white/10 flex items-center justify-center flex-shrink-0 transition-colors"><svg className="w-6 h-6 text-indigo-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">{getEntityIcon(id)}</svg></div>
                                <div className="text-left overflow-hidden flex-grow">
                                  <p className="text-white font-black uppercase text-sm group-hover:text-white truncate tracking-tighter italic">{id.split('.')[1]?.replace(/_/g, ' ') || id}</p>
                                  <code className="text-[9px] font-mono text-slate-500 group-hover:text-indigo-200 truncate block opacity-60">{id}</code>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )) : (
                        <div className="flex flex-col items-center justify-center py-20 opacity-20 text-center"><svg className="w-16 h-16 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><p className="text-white font-black italic uppercase tracking-widest text-sm">No matches</p></div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div onClick={() => setShowListManager(true)} className="group relative bg-slate-900 border-4 border-slate-800 rounded-[4rem] p-10 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-500/5 transition-all duration-700 shadow-2xl shadow-black h-full text-center">
                    <div className="w-24 h-24 bg-slate-800 rounded-[2.5rem] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-indigo-600 transition-all duration-700 shadow-xl group-hover:shadow-indigo-500/20"><svg className="w-12 h-12 text-indigo-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg></div>
                    <p className="text-white font-black text-3xl uppercase tracking-tighter italic">Entity Sync</p>
                    <p className="text-slate-500 text-xs mt-4 font-bold uppercase tracking-widest">Pick From Your List</p>
                  </div>
                )}
              </div>

              <div onClick={() => fileInputRef.current?.click()} className="group relative bg-slate-900 border-4 border-dashed border-slate-800 rounded-[4rem] p-10 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-500/5 transition-all duration-700 shadow-2xl shadow-black h-full text-center">
                <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && handleFile(e.target.files[0])} className="hidden" accept="image/*" />
                <div className="w-24 h-24 bg-slate-800 rounded-[2.5rem] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-indigo-600 transition-all duration-700 shadow-xl group-hover:shadow-indigo-500/20"><svg className="w-12 h-12 text-indigo-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg></div>
                <p className="text-white font-black text-3xl uppercase tracking-tighter italic">Drop Screen</p>
                <p className="text-slate-500 text-xs mt-4 font-bold uppercase tracking-widest">Scan Your Dashboard</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start animate-in fade-in duration-700">
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
              <div className="bg-slate-900 p-4 rounded-[3rem] shadow-2xl border border-slate-800 ring-8 ring-indigo-500/5 overflow-hidden group">
                <div className="overflow-y-auto max-h-[70vh] rounded-[2rem] scrollbar-hide border border-slate-800">
                  {image === 'DIRECT_SELECTION' ? (
                    <div className="aspect-video bg-indigo-900/30 flex flex-col items-center justify-center p-12 text-center">
                       <svg className="w-24 h-24 text-indigo-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                       <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">Verified Direct</h4>
                       <p className="text-indigo-300/70 mt-3 text-sm font-medium">Controllable ID routing active.</p>
                    </div>
                  ) : <img src={image} className="w-full h-auto opacity-70 group-hover:opacity-100 transition-opacity duration-500" alt="Dashboard Scan" />}
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-12">
              {(analysing || generating) ? (
                <div className="bg-indigo-600 rounded-[4rem] p-24 text-white shadow-2xl animate-in zoom-in-95 duration-500 flex flex-col items-center text-center space-y-10 overflow-hidden relative">
                  <div className="relative z-10"><div className="w-48 h-48 border-[16px] border-indigo-400 border-t-white rounded-full animate-spin flex items-center justify-center"><span className="text-4xl font-black italic">{(processingTime / 10).toFixed(1)}s</span></div></div>
                  <h3 className="text-5xl font-black mb-4 italic tracking-tighter uppercase">{analysing ? 'Finding Devices...' : 'Building Timer Code...'}</h3>
                </div>
              ) : discovery && !yaml ? (
                <div className="space-y-12 animate-in fade-in slide-in-from-right-12 duration-700">
                  {discovery.entities.length > 1 && (
                    <div className="space-y-8">
                      <h3 className="text-6xl font-black text-white italic tracking-tighter leading-none uppercase">Select Target</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {discovery.entities.map((entity) => (
                          <div key={entity.entityId} onClick={() => handleSelectEntity(entity)} className={`group cursor-pointer p-8 rounded-[3rem] border-2 transition-all duration-300 relative overflow-hidden ${selectedEntity?.entityId === entity.entityId ? 'border-indigo-600 bg-indigo-600/10 shadow-2xl ring-4 ring-indigo-500/20' : 'border-slate-800 bg-slate-900 hover:border-slate-700'}`}>
                            <h4 className="text-2xl font-black text-white italic leading-tight mb-3 tracking-tighter uppercase">{entity.name}</h4>
                            <code className="text-[10px] font-mono text-slate-500 truncate block bg-black/40 px-4 py-3 rounded-2xl border border-white/5">{entity.entityId}</code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-900/80 border-2 border-indigo-600/30 rounded-[4rem] p-16 shadow-2xl space-y-12 backdrop-blur-sm">
                    <div className="flex items-center gap-6"><div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white font-black text-2xl italic shadow-lg">{discovery.entities.length > 1 ? '2' : '1'}</div><h3 className="text-5xl font-black text-white italic tracking-tighter uppercase">Configure Timer</h3></div>
                    <div className="bg-amber-500/10 border-2 border-amber-500/30 p-10 rounded-[3rem] flex gap-8 items-center ring-8 ring-amber-500/5">
                      <div className="w-14 h-14 bg-amber-500 rounded-2xl flex-shrink-0 flex items-center justify-center text-slate-900 shadow-xl"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
                      <div><p className="text-amber-300 font-black uppercase tracking-[0.2em] text-xs mb-2 italic">Device Found</p><p className="text-amber-100/70 text-base font-medium leading-relaxed">Type: <b>{getGroupForEntityId(customEntityId)}</b>. This timer will turn off the device automatically when time runs out.</p></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-6 italic">Device Name</label>
                        <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} className="w-full bg-slate-800/50 border-2 border-slate-700 rounded-[2.5rem] px-8 py-6 text-xl font-bold text-white focus:border-indigo-500 transition-colors outline-none shadow-inner" placeholder="e.g. Master AC" />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-6 italic">Entity ID</label>
                        <div className="relative group">
                          <input type="text" value={customEntityId} onChange={(e) => setCustomEntityId(e.target.value)} className="w-full bg-slate-800/50 border-2 border-slate-700 rounded-[2.5rem] pl-8 pr-16 py-6 text-xl font-mono text-indigo-400 focus:border-indigo-500 transition-colors outline-none shadow-inner" placeholder="e.g. climate.living_room_ac" />
                          <button onClick={handlePasteId} title="Paste ID" className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-indigo-400 transition-all hover:scale-110 active:scale-95 shadow-xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg></button>
                        </div>
                      </div>
                    </div>

                    {selectedEntity?.type === 'climate' && (
                      <div className="bg-indigo-600/5 border-2 border-indigo-600/20 rounded-[4rem] p-12 space-y-12 animate-in slide-in-from-top-4">
                        <h4 className="text-2xl font-black italic text-indigo-400 uppercase tracking-tighter text-center">Climate Settings</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                          <div className="space-y-6">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block italic text-center">HVAC Mode</label>
                            <div className="flex bg-slate-800/80 rounded-[2rem] p-2 border-2 border-slate-700">
                              {(['cool', 'heat', 'auto'] as const).map((mode) => (
                                <button key={mode} onClick={() => setHvacMode(mode)} className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${hvacMode === mode ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}>{mode}</button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-6 text-center">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block italic">Target Temp</label>
                            <div className="flex items-center justify-center gap-6">
                              <button onClick={() => setTargetTemp(t => Math.max(16, t - 0.5))} className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-indigo-600 transition-colors shadow-lg"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4" /></svg></button>
                              <div className="flex items-baseline"><span className="text-7xl font-black italic text-white">{targetTemp.toFixed(1)}</span><span className="text-2xl font-black text-slate-600 ml-2">°C</span></div>
                              <button onClick={() => setTargetTemp(t => Math.min(32, t + 0.5))} className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-indigo-600 transition-colors shadow-lg"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg></button>
                            </div>
                            <input type="range" min="16" max="32" step="0.5" value={targetTemp} onChange={(e) => setTargetTemp(parseFloat(e.target.value))} className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-600 mt-4" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-16 bg-black/40 rounded-[4rem] shadow-inner text-center border border-white/5 space-y-10">
                      <div className="flex flex-col items-center gap-8">
                        <div className="w-full space-y-4">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block italic">Timer Length (Minutes)</label>
                          <input type="range" min="1" max="240" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} className="w-full h-3 bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-600" />
                          <div className="flex items-baseline justify-center gap-6"><span className="text-[8rem] font-black text-indigo-500 italic tracking-tighter">{duration}</span><span className="text-2xl font-black text-slate-700 uppercase italic">min</span></div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full pt-4">
                          <div className="space-y-6">
                            <label className="flex items-center gap-4 cursor-pointer group bg-slate-800/40 px-6 py-4 rounded-3xl border border-white/5 hover:border-indigo-500/50 transition-all">
                              <input type="checkbox" checked={includeSafety} onChange={(e) => setIncludeSafety(e.target.checked)} className="w-6 h-6 rounded-lg bg-slate-900 border-2 border-slate-700 checked:bg-indigo-600 accent-indigo-600 transition-all cursor-pointer" />
                              <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors italic">Safety Override</span>
                            </label>

                            {customEntityId.startsWith('light.') && (
                              <label className="flex items-center gap-4 cursor-pointer group bg-slate-800/40 px-6 py-4 rounded-3xl border border-white/5 hover:border-indigo-500/50 transition-all">
                                <input type="checkbox" checked={includeFade} onChange={(e) => setIncludeFade(e.target.checked)} className="w-6 h-6 rounded-lg bg-slate-900 border-2 border-slate-700 checked:bg-indigo-600 accent-indigo-600 transition-all cursor-pointer" />
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors italic">10s Fade Out</span>
                              </label>
                            )}

                            <label className="flex items-center gap-4 cursor-pointer group bg-slate-800/40 px-6 py-4 rounded-3xl border border-white/5 hover:border-indigo-500/50 transition-all">
                              <input type="checkbox" checked={preWarning} onChange={(e) => setPreWarning(e.target.checked)} className="w-6 h-6 rounded-lg bg-slate-900 border-2 border-slate-700 checked:bg-indigo-600 accent-indigo-600 transition-all cursor-pointer" />
                              <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors italic">2m End Warning</span>
                            </label>

                            <label className="flex items-center gap-4 cursor-pointer group bg-slate-800/40 px-6 py-4 rounded-3xl border border-white/5 hover:border-indigo-500/50 transition-all">
                              <input type="checkbox" checked={usePresets} onChange={(e) => setUsePresets(e.target.checked)} className="w-6 h-6 rounded-lg bg-slate-900 border-2 border-slate-700 checked:bg-indigo-600 accent-indigo-600 transition-all cursor-pointer" />
                              <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors italic">Quick Presets</span>
                            </label>

                            <label className="flex items-center gap-4 cursor-pointer group bg-slate-800/40 px-6 py-4 rounded-3xl border border-white/5 hover:border-indigo-500/50 transition-all">
                              <input type="checkbox" checked={sunsetOnly} onChange={(e) => setSunsetOnly(e.target.checked)} className="w-6 h-6 rounded-lg bg-slate-900 border-2 border-slate-700 checked:bg-indigo-600 accent-indigo-600 transition-all cursor-pointer" />
                              <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors italic">Sunset Only</span>
                            </label>
                          </div>

                          <div className="space-y-4">
                            <div className="bg-indigo-500/5 border-2 border-indigo-500/20 p-8 rounded-[2.5rem] space-y-4">
                              <div className="flex items-center gap-3 mb-2">
                                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 italic">Presence Aware</span>
                              </div>
                              <input 
                                type="text" 
                                placeholder="Presence entity (e.g. binary_sensor.room_motion)" 
                                value={presenceSensor} 
                                onChange={(e) => setPresenceSensor(e.target.value)} 
                                className="w-full bg-slate-800/80 border-2 border-slate-700 rounded-2xl px-4 py-3 text-xs font-mono text-white outline-none focus:border-indigo-500 transition-colors"
                              />
                              <p className="text-[9px] text-slate-500 italic">Timer will postpone shut-off if this sensor is active.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button onClick={handleGenerate} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-12 rounded-[4rem] shadow-2xl transition-all transform hover:scale-[1.02] active:scale-95 text-4xl uppercase tracking-[0.2em] italic">GET TIMER CODE</button>
                  </div>
                </div>
              ) : yaml && (
                <div ref={resultsRef} className="space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000 pb-32">
                  <div className="flex items-end justify-between px-8"><h3 className="text-6xl font-black text-white italic tracking-tighter uppercase">Your Timer Code</h3><button onClick={() => setYaml(null)} className="bg-slate-800 px-6 py-3 rounded-2xl text-indigo-400 font-black uppercase text-xs hover:bg-slate-700 shadow-xl">Go Back</button></div>
                  <div className="bg-indigo-600/10 border-2 border-indigo-600/30 p-10 rounded-[4rem] space-y-6 shadow-2xl backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4"><h4 className="text-2xl font-black italic text-indigo-400 uppercase">Step 0: Initial Setup</h4><button onClick={handleCopyStep0} className={`text-xs px-6 py-3 rounded-2xl font-black transition-all uppercase shadow-xl ${copiedStep0 ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-50'}`}>{copiedStep0 ? 'COPIED' : 'COPY CODE'}</button></div>
                    <p className="text-slate-400 font-medium text-lg italic">Add this block to your <code>configuration.yaml</code> (One-time only):</p>
                    <pre className="bg-black/50 p-8 rounded-3xl font-mono text-indigo-300 text-base overflow-x-auto border border-white/5">{STEP0_YAML}</pre>
                  </div>
                  <div className="grid gap-12">
                    <CodeBlock 
                      title="Timer Config" 
                      subtitle="Put this in /packages" 
                      code={yaml.helpers} 
                      filename={filenames.helpers} 
                      stepNumber={1} 
                    />
                    <CodeBlock 
                      title="Timer Script" 
                      subtitle="Put this in /scripts" 
                      code={yaml.scripts} 
                      filename={filenames.scripts} 
                      stepNumber={2} 
                    />
                    <CodeBlock 
                      title="Auto-Off Rule" 
                      subtitle="Put this in /automations" 
                      code={yaml.automations} 
                      filename={filenames.automations} 
                      stepNumber={3} 
                    />
                    <CodeBlock 
                      title="Dashboard Card" 
                      subtitle="Use in Dashboard Editor" 
                      code={yaml.dashboard} 
                      filename="dashboard_ui.yaml" 
                    />
                  </div>
                  <div className="flex justify-center pt-12"><button onClick={resetApp} className="group flex items-center gap-6 px-16 py-10 bg-slate-900 border-2 border-slate-800 text-slate-400 font-black rounded-[4rem] hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all duration-500 uppercase italic text-2xl shadow-3xl transform active:scale-95"><svg className="w-8 h-8 group-hover:rotate-180 transition-transform duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>Create Another</button></div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {showListManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-500">
          <div className="bg-[#0f172a] w-full max-w-6xl rounded-[5rem] shadow-[0_0_100px_-15px_rgba(79,70,229,0.4)] overflow-hidden border border-slate-800 border-t-white/10">
            <div className="bg-slate-800 p-20 text-white flex items-center justify-between relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <div className="relative z-10"><h3 className="text-6xl font-black italic tracking-tighter uppercase">Entity Sync</h3><p className="text-slate-400 mt-6 text-2xl font-medium max-w-2xl italic">Import your device list to quickly pick entities without typing.</p></div>
              <div className="flex items-center gap-6 relative z-10">
                <button 
                  onClick={handleClearLibrary} 
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-6 py-4 rounded-3xl text-xs font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-3 border border-red-500/20"
                  title="Wipe Library"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Clear Library
                </button>
                <button onClick={() => setShowListManager(false)} className="bg-white/10 p-6 rounded-full hover:bg-white/20 transition-all hover:rotate-90 active:scale-90 shadow-2xl"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            </div>
            <div className="bg-slate-900 px-20 py-8 flex gap-8 border-b border-white/5">
              <button onClick={() => setListManagerTab('card')} className={`px-8 py-4 rounded-3xl font-black uppercase tracking-widest text-sm italic transition-all ${listManagerTab === 'card' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:bg-white/5'}`}>Auto-Sync JSON</button>
              <button onClick={() => setListManagerTab('manual')} className={`px-8 py-4 rounded-3xl font-black uppercase tracking-widest text-sm italic transition-all ${listManagerTab === 'manual' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:bg-white/5'}`}>Manual Copy/Paste</button>
            </div>
            <div className="p-20 space-y-16 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {listManagerTab === 'card' ? (
                <div className="space-y-12 animate-in fade-in slide-in-from-left-4">
                  <div className="bg-indigo-600 rounded-[4rem] p-12 text-white shadow-3xl relative overflow-hidden flex flex-col lg:flex-row gap-12 items-center">
                    <div className="flex-grow space-y-8">
                      <div className="space-y-4"><h4 className="text-4xl font-black italic uppercase">Automatic Sync</h4>
                        <p className="text-indigo-100 text-xl font-medium italic">
                          Paste the JSON from the <a href={EXPORTER_CARD_REPO} target="_blank" rel="noopener noreferrer" className="underline decoration-indigo-300 hover:text-white inline-flex items-center gap-1 transition-colors">Entity Exporter Card <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a> in Home Assistant.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <button onClick={handleCopyRepoUrl} className="px-8 py-4 rounded-[2rem] font-black uppercase tracking-widest text-xs italic bg-indigo-400 text-white hover:bg-indigo-300 transition-all shadow-2xl">GET EXPORTER URL</button>
                        <button onClick={handleCopyCardYaml} className="px-8 py-4 rounded-[2rem] font-black uppercase tracking-widest text-xs italic bg-white text-indigo-600 hover:bg-indigo-50 transition-all shadow-2xl">COPY CARD YAML</button>
                      </div>
                    </div>
                    <div className="bg-black/20 p-8 rounded-[3rem] font-mono text-xs text-indigo-200 border border-white/10 w-full lg:w-96 shrink-0 flex flex-col"><p className="text-[10px] text-indigo-400 mb-4 font-black uppercase tracking-widest italic opacity-50">Blueprint Preview:</p><pre className="flex-grow whitespace-pre-wrap">{EXPORTER_CARD_YAML}</pre></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingJson(true); }} onDragLeave={() => setIsDraggingJson(false)} onDrop={handleJsonDrop} className={`bg-slate-800/50 p-12 rounded-[4rem] border-2 space-y-8 flex flex-col justify-center items-center text-center group transition-all duration-300 ${isDraggingJson ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]' : 'border-slate-800 hover:border-indigo-500/30'}`}><div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-white mb-2 shadow-xl transition-all ${isDraggingJson ? 'bg-indigo-500 scale-110 rotate-12' : 'bg-indigo-600 group-hover:scale-110'}`}><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg></div><h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">Drop JSON</h4><label className="px-8 py-4 bg-indigo-600 hover:bg-indigo-50 text-white font-black rounded-2xl text-xs uppercase tracking-widest cursor-pointer shadow-xl active:scale-95">SELECT FILE<input type="file" className="hidden" accept=".json" onChange={handleJsonFileUpload} /></label></div>
                    <div className="bg-slate-800/50 p-12 rounded-[4rem] border-2 border-slate-800 space-y-8"><h4 className="text-2xl font-black text-white italic uppercase">Paste JSON</h4><textarea onChange={(e) => handleMagicExtract(e.target.value)} placeholder="Paste the JSON export content here..." className="w-full h-32 bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 font-mono text-indigo-400 focus:border-indigo-500 outline-none transition-all text-sm" /></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-12 animate-in fade-in slide-in-from-right-4">
                  <div className="bg-slate-800 rounded-[4rem] p-12 text-white shadow-3xl relative overflow-hidden flex flex-col md:flex-row gap-12 items-center"><div className="flex-grow space-y-6"><h4 className="text-4xl font-black italic uppercase tracking-tighter">Manual Extract</h4><p className="text-slate-400 text-xl font-medium italic">Copy the table from Developer Tools > States and paste it here.</p></div></div>
                  <div className="bg-black/40 p-12 rounded-[4rem] border border-white/5 space-y-6 shadow-2xl"><textarea value={rawEntityList} onChange={(e) => setRawEntityList(e.target.value)} placeholder="Paste state table here..." className="w-full h-96 bg-slate-900/50 border-4 border-slate-800 rounded-[3rem] p-10 font-mono text-indigo-300 focus:border-indigo-500 outline-none resize-none custom-scrollbar transition-all text-xl shadow-inner" /><div className="flex justify-center"><button onClick={() => handleMagicExtract()} className="bg-indigo-600 hover:bg-indigo-500 px-12 py-6 rounded-3xl text-white font-black italic uppercase tracking-widest shadow-2xl transition-all transform active:scale-95">EXTRACT DEVICES</button></div></div>
                </div>
              )}
              <button onClick={() => setShowListManager(false)} className="w-full bg-indigo-600 text-white font-black py-12 rounded-[4rem] hover:bg-indigo-700 transition-all uppercase tracking-[0.3em] italic shadow-3xl text-3xl shadow-indigo-600/20">ALL DONE</button>
            </div>
          </div>
        </div>
      )}

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-500">
          <div className="bg-[#0f172a] w-full max-w-4xl rounded-[5rem] shadow-2xl overflow-hidden border border-slate-800">
            <div className="bg-indigo-600 p-20 text-white flex items-center justify-between relative overflow-hidden"><div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div><h3 className="text-6xl font-black italic tracking-tighter uppercase leading-none relative z-10">How to include app generated YAML files</h3><button onClick={() => setShowGuide(false)} className="relative z-10 bg-white/10 p-5 rounded-full hover:bg-white/20 transition-all active:scale-90"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
            <div className="p-20 space-y-16 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="bg-amber-600/10 border-2 border-amber-600/30 p-10 rounded-[3rem] space-y-6 shadow-xl"><h4 className="text-3xl font-black text-amber-500 italic uppercase tracking-tighter">⚠️ Create the Folders First</h4><p className="text-slate-300 text-lg font-medium italic leading-relaxed">Use the File Editor to create folders named <code>packages/</code>, <code>automations/</code>, and <code>scripts/</code> in your <code>/config/</code> folder.</p></div>
              <div className="space-y-8"><h4 className="text-4xl font-black text-white italic uppercase tracking-tighter">Installation 101</h4><p className="text-slate-400 text-2xl font-medium leading-relaxed italic">Add these lines to your Home Assistant configuration to support the timer files.</p></div>
              <div className="bg-black/60 p-12 rounded-[3rem] border-2 border-white/5 shadow-3xl"><p className="text-indigo-400 font-black mb-6 uppercase tracking-[0.3em] text-xs italic">Paste this into configuration.yaml:</p><div className="space-y-3 font-mono text-indigo-300 text-lg"><code className="block">homeassistant: &#123; packages: !include_dir_named packages/ &#125;</code><code className="block">automation: !include_dir_list automations/</code><code className="block">script: !include_dir_list scripts/</code></div></div>
              <div className="bg-indigo-600/10 border-2 border-indigo-600/30 p-10 rounded-[3rem] space-y-6 shadow-xl">
                <h4 className="text-3xl font-black text-indigo-500 italic uppercase tracking-tighter">🔄 Apply Changes</h4>
                <p className="text-slate-300 text-lg font-medium italic leading-relaxed">After adding files to the folders, go to <b>Developer Tools > YAML</b> and click <b>Reload All YAML Configuration</b> or <b>Restart Home Assistant</b>.</p>
              </div>
              <button onClick={() => setShowGuide(false)} className="w-full bg-white text-slate-900 font-black py-10 rounded-[3rem] hover:bg-slate-200 transition-all uppercase tracking-[0.2em] italic shadow-2xl text-2xl">GOT IT</button>
            </div>
          </div>
        </div>
      )}

      {showPrerequisites && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-500">
          <div className="bg-[#0f172a] w-full max-w-5xl rounded-[5rem] shadow-2xl overflow-hidden border border-slate-800">
            <div className="bg-amber-600 p-20 text-white flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <h3 className="text-6xl font-black italic tracking-tighter uppercase relative z-10">Prerequisites</h3>
              <button onClick={() => setShowPrerequisites(false)} className="relative z-10 bg-white/10 p-5 rounded-full hover:bg-white/20 transition-all active:scale-90"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-20 space-y-16 max-h-[70vh] overflow-y-auto custom-scrollbar">
              
              {/* Requirement 1 */}
              <div className="space-y-8">
                <div className="flex gap-8 items-center">
                   <div className="w-16 h-16 bg-amber-500 rounded-3xl flex items-center justify-center shrink-0 shadow-2xl shadow-amber-500/20 text-slate-900 font-black italic text-2xl">01</div>
                   <h4 className="text-4xl font-black text-white italic uppercase tracking-tighter">Enable Modular Config</h4>
                </div>
                <div className="bg-slate-800/40 p-10 rounded-[3rem] border border-white/5 space-y-6">
                  <p className="text-slate-300 text-lg font-medium italic">
                    The timer system depends on <b>Packages</b> and folder includes to keep your config clean. Add this to the top of your <code>configuration.yaml</code>:
                  </p>
                  <div className="bg-black/60 p-8 rounded-3xl font-mono text-indigo-300 text-sm border border-white/5 relative group">
                    <pre className="whitespace-pre-wrap">homeassistant:{"\n"}  packages: !include_dir_named packages/{"\n\n"}automation: !include_dir_list automations/{"\n"}script: !include_dir_list scripts/</pre>
                    <button onClick={() => navigator.clipboard.writeText("homeassistant:\n  packages: !include_dir_named packages/\n\nautomation: !include_dir_list automations/\nscript: !include_dir_list scripts/")} className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all">Copy</button>
                  </div>
                </div>
              </div>

              {/* Requirement 2 */}
              <div className="space-y-8">
                <div className="flex gap-8 items-center">
                   <div className="w-16 h-16 bg-amber-500 rounded-3xl flex items-center justify-center shrink-0 shadow-2xl shadow-amber-500/20 text-slate-900 font-black italic text-2xl">02</div>
                   <h4 className="text-4xl font-black text-white italic uppercase tracking-tighter">Prepare Config Folders</h4>
                </div>
                <div className="bg-slate-800/40 p-10 rounded-[3rem] border border-white/5 space-y-8">
                  <p className="text-slate-300 text-lg font-medium italic">
                    Use the <b>File Editor</b> or <b>VS Code</b> add-on in Home Assistant to create these folders inside your <code>/config/</code> directory:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['packages', 'automations', 'scripts'].map(folder => (
                      <div key={folder} className="bg-black/40 p-6 rounded-2xl border border-white/5 text-center">
                        <svg className="w-8 h-8 text-indigo-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                        <code className="text-white font-mono font-bold">{folder}/</code>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Requirement 3 */}
              <div className="space-y-8">
                <div className="flex gap-8 items-center">
                   <div className="w-16 h-16 bg-amber-500 rounded-3xl flex items-center justify-center shrink-0 shadow-2xl shadow-amber-500/20 text-slate-900 font-black italic text-2xl">03</div>
                   <h4 className="text-4xl font-black text-white italic uppercase tracking-tighter">Reload YAML</h4>
                </div>
                <div className="bg-slate-800/40 p-10 rounded-[3rem] border border-white/5 space-y-6">
                  <p className="text-slate-300 text-lg font-medium italic">
                    Whenever you add or modify code files, you must tell Home Assistant to look for them.
                  </p>
                  <div className="bg-black/40 p-8 rounded-3xl border border-white/5 space-y-4">
                    <p className="text-white text-sm font-bold uppercase tracking-widest italic text-indigo-400">Action Plan:</p>
                    <ol className="text-slate-300 space-y-2 text-sm italic list-decimal list-inside">
                      <li>Open <b>Developer Tools</b></li>
                      <li>Go to the <b>YAML</b> tab</li>
                      <li>Click <b>Reload All YAML Configuration</b> (or restart)</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Requirement 4 */}
              <div className="space-y-8">
                <div className="flex gap-8 items-center">
                   <div className="w-16 h-16 bg-amber-500 rounded-3xl flex items-center justify-center shrink-0 shadow-2xl shadow-amber-500/20 text-slate-900 font-black italic text-2xl">04</div>
                   <h4 className="text-4xl font-black text-white italic uppercase tracking-tighter">Google Gemini Key</h4>
                </div>
                <div className="bg-slate-800/40 p-10 rounded-[3rem] border border-white/5 space-y-6">
                  <p className="text-slate-300 text-lg font-medium italic">
                    To use the "Dashboard Scan" AI feature, you need a Google Gemini API Key. Vision models require a <b>Billing-Enabled</b> (Paid) Google Cloud project.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <a href="https://aistudio.google.com/" target="_blank" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl">Get API Key</a>
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl">Check Billing Info</a>
                  </div>
                </div>
              </div>

              <div className="bg-red-500/10 border-2 border-red-500/30 p-10 rounded-[3rem] space-y-4">
                 <div className="flex items-center gap-4 text-red-400">
                   <svg className="w-8 h-8 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                   <h5 className="text-2xl font-black uppercase italic tracking-tighter">Warning: Restart Required</h5>
                 </div>
                 <p className="text-red-200/70 font-medium italic">
                   After editing <code>configuration.yaml</code> for the first time, you <b>must restart Home Assistant</b> before the new folders will be recognized.
                 </p>
              </div>

              <button onClick={() => setShowPrerequisites(false)} className="w-full bg-white text-slate-900 font-black py-10 rounded-[3rem] hover:bg-slate-200 transition-all uppercase tracking-[0.2em] italic shadow-2xl text-2xl">GOT IT, LET'S GO</button>
            </div>
          </div>
        </div>
      )}

      {showFeatures && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-500">
          <div className="bg-[#0f172a] w-full max-w-5xl rounded-[5rem] shadow-2xl overflow-hidden border border-slate-800">
            <div className="bg-indigo-600 p-20 text-white flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <h3 className="text-6xl font-black italic tracking-tighter uppercase relative z-10">Features</h3>
              <button onClick={() => setShowFeatures(false)} className="relative z-10 bg-white/10 p-5 rounded-full hover:bg-white/20 transition-all active:scale-90"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-20 space-y-12 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Visual Discovery */}
                <div className="p-10 bg-slate-800/50 rounded-[3.5rem] border border-white/5 space-y-4">
                  <div className="w-14 h-14 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </div>
                  <h6 className="text-2xl font-black text-white italic uppercase tracking-tighter">AI Visual Scan</h6>
                  <p className="text-slate-400 font-medium italic">Drop any dashboard screenshot. Gemini Pro Vision detects and names switchable targets instantly.</p>
                </div>

                {/* Climate Specific */}
                <div className="p-10 bg-slate-800/50 rounded-[3.5rem] border border-white/5 space-y-4">
                  <div className="w-14 h-14 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  </div>
                  <h6 className="text-2xl font-black text-white italic uppercase tracking-tighter">Climate Automation</h6>
                  <p className="text-slate-400 font-medium italic">Automatically sets target temperature and HVAC mode (Cool/Heat/Auto) when the timer starts for AC units.</p>
                </div>

                {/* Light Specific */}
                <div className="p-10 bg-slate-800/50 rounded-[3.5rem] border border-white/5 space-y-4">
                  <div className="w-14 h-14 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.364-6.364l-.707-.707M6.736 14h10.528A5.002 5.002 0 0112 19a5.002 5.002 0 01-4.736-5z" /></svg>
                  </div>
                  <h6 className="text-2xl font-black text-white italic uppercase tracking-tighter">Smooth Fade Out</h6>
                  <p className="text-slate-400 font-medium italic">Lights can be configured with a 10-second transition. No more instant pitch-black rooms when the timer ends.</p>
                </div>

                {/* Switches & Valves */}
                <div className="p-10 bg-slate-800/50 rounded-[3.5rem] border border-white/5 space-y-4">
                  <div className="w-14 h-14 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <h6 className="text-2xl font-black text-white italic uppercase tracking-tighter">Switches & Valves</h6>
                  <p className="text-slate-400 font-medium italic">Perfect for pool pumps, heaters, or water valves. Reliable auto-off logic for simple binary devices.</p>
                </div>

                {/* Presence Aware */}
                <div className="p-10 bg-slate-800/50 rounded-[3.5rem] border border-white/5 space-y-4">
                  <div className="w-14 h-14 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <h6 className="text-2xl font-black text-white italic uppercase tracking-tighter">Presence Aware</h6>
                  <p className="text-slate-400 font-medium italic">Postpones auto-off if room motion is detected, preventing you from being left in the dark.</p>
                </div>

                {/* Mobile Alerts */}
                <div className="p-10 bg-slate-800/50 rounded-[3.5rem] border border-white/5 space-y-4">
                  <div className="w-14 h-14 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  </div>
                  <h6 className="text-2xl font-black text-white italic uppercase tracking-tighter">Pre-End Warnings</h6>
                  <p className="text-slate-400 font-medium italic">Receive a mobile notification 2 minutes before the device turns off so you can extend the time if needed.</p>
                </div>
              </div>
              <button onClick={() => setShowFeatures(false)} className="w-full bg-white text-slate-900 font-black py-10 rounded-[3rem] hover:bg-slate-200 transition-all uppercase tracking-[0.2em] italic shadow-2xl text-2xl">LET'S BUILD</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse-subtle { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.98; transform: scale(0.998); } }
        .animate-pulse-subtle { animation: pulse-subtle 3s ease-in-out infinite; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #4f46e5 transparent; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(79, 70, 229, 0.5); border-radius: 10px; border: 2px solid transparent; background-clip: content-box; background-color: #4f46e5; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(79, 70, 229, 0.8); }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 32px; height: 32px; background: #4f46e5; border-radius: 50%; cursor: pointer; border: 4px solid white; box-shadow: 0 0 15px rgba(79, 70, 229, 0.5); }
      `}</style>
    </div>
  );
};

export default App;
