
import React from 'react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
      <div className="relative bg-slate-900 border-2 border-indigo-500/30 rounded-[3rem] p-12 max-w-2xl w-full space-y-8 animate-in zoom-in-95 overflow-y-auto max-h-[90vh] custom-scrollbar">
         <h2 className="text-4xl font-black italic tracking-tighter uppercase text-white leading-none">Setup Guide</h2>
         <div className="space-y-6">
           <div className="bg-amber-600/10 border border-amber-600/30 p-6 rounded-2xl">
             <p className="text-amber-300 font-bold text-sm italic">
               Note: Automations in Packages cannot be edited via the visual UI editor. This is a Home Assistant security feature for modular code.
             </p>
           </div>
           <div className="space-y-4">
             <h3 className="text-xl font-black text-indigo-400 uppercase italic">Hybrid Setup</h3>
             <pre className="bg-black/50 p-6 rounded-2xl text-xs font-mono text-indigo-300 border border-white/5 whitespace-pre-wrap">{`homeassistant:
  packages: !include_dir_named packages/

automation: !include automations.yaml
script: !include scripts.yaml`}</pre>
           </div>
         </div>
         <button onClick={onClose} className="w-full py-5 bg-indigo-600 rounded-2xl font-black uppercase tracking-widest italic shadow-xl">GOT IT</button>
      </div>
    </div>
  );
};
