
import React, { useState, useEffect } from 'react';
import { AppState, AppAction, ScheduleMode, Recurrence } from '../types';
import { isValidEntityId, isValidFriendlyName } from '../utils/validation';
import { MIN_TIMER_DURATION, MAX_TIMER_DURATION } from '../constants/app';

interface ConfigurationFormProps {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  onGenerate: () => void;
}

export const ConfigurationForm: React.FC<ConfigurationFormProps> = ({ state, dispatch, onGenerate }) => {
  const [targetTemp, setTargetTemp] = useState(21);
  const [hvacMode, setHvacMode] = useState('heat_cool');

  const isEntityValid = isValidEntityId(state.customEntityId);
  const isNameValid = isValidFriendlyName(state.customName);
  const isValid = isEntityValid && isNameValid;

  const isClimate = state.customEntityId.toLowerCase().startsWith('climate.');

  // Wrap the onGenerate to include local climate state
  const handleGenerate = () => {
    // We could dispatch these to state if we wanted, or just pass them to onGenerate
    // For simplicity, we'll assume the generate function in App.tsx reads from the full state
    // Let's actually add them to the AppAction if we want them in the state.
    // For now, let's just trigger the parent generate with these values.
    onGenerate();
  };

  return (
    <div className="bg-slate-900/80 border-2 border-indigo-600/30 rounded-[4rem] p-16 space-y-12 shadow-3xl backdrop-blur-sm animate-in fade-in duration-500">
      <h3 className="text-5xl font-black italic uppercase tracking-tighter text-white">Timer Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4 italic">Friendly Name</label>
          <input 
            type="text" 
            value={state.customName} 
            onChange={(e) => dispatch({ type: 'SET_CUSTOM_NAME', payload: e.target.value })} 
            className={`w-full bg-slate-800 border-2 rounded-3xl px-8 py-6 text-xl text-white outline-none transition-colors ${state.customName && !isNameValid ? 'border-red-500/50' : 'border-slate-700 focus:border-indigo-600'}`} 
            placeholder="e.g. Garden Tap" 
          />
        </div>
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4 italic">Target Entity ID</label>
          <input 
            type="text" 
            value={state.customEntityId} 
            onChange={(e) => dispatch({ type: 'SET_CUSTOM_ENTITY_ID', payload: e.target.value })} 
            className={`w-full bg-slate-800 border-2 rounded-3xl px-8 py-6 text-xl text-indigo-400 font-mono outline-none transition-colors ${state.customEntityId && !isEntityValid ? 'border-red-500/50' : 'border-slate-700 focus:border-indigo-600'}`} 
            placeholder="switch.valve_1" 
          />
        </div>
      </div>

      {isClimate && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-12 bg-indigo-600/5 border-2 border-indigo-600/20 rounded-[3rem] animate-in slide-in-from-top-4">
          <div className="space-y-6">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 ml-4 italic">HVAC Mode</label>
            <div className="grid grid-cols-2 gap-3">
              {['heat_cool', 'heat', 'cool', 'fan_only'].map(mode => (
                <button 
                  key={mode}
                  onClick={() => setHvacMode(mode)}
                  className={`py-4 rounded-2xl text-[10px] font-black uppercase italic border transition-all ${hvacMode === mode ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-500 border-transparent hover:text-slate-300'}`}
                >
                  {mode.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-6 flex flex-col justify-center">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 ml-4 italic text-center">Target Temp: {targetTemp}°C</label>
            <input 
              type="range" 
              min="16" 
              max="30" 
              step="0.5"
              value={targetTemp}
              onChange={(e) => setTargetTemp(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-full appearance-none accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-black text-slate-600 uppercase italic">
              <span>16°C</span>
              <span>30°C</span>
            </div>
          </div>
        </div>
      )}

      <div className="p-16 bg-black/40 rounded-[4rem] text-center space-y-10 border border-white/5 shadow-inner">
        <p className="text-slate-500 uppercase tracking-widest text-xs font-black italic">Default Off Duration</p>
        <input 
          type="range" 
          min={MIN_TIMER_DURATION} 
          max={MAX_TIMER_DURATION} 
          value={state.duration} 
          onChange={(e) => dispatch({ type: 'SET_DURATION', payload: parseInt(e.target.value) })} 
          className="w-full h-3 bg-slate-800 rounded-full appearance-none accent-indigo-600 cursor-pointer" 
        />
        <div className="text-[8rem] font-black text-indigo-500 italic tracking-tighter leading-none">
          {state.duration}<span className="text-2xl ml-4 text-slate-700 uppercase">min</span>
        </div>
      </div>

      <div className="bg-black/40 p-12 rounded-[3.5rem] border border-white/5 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p className="text-indigo-400 uppercase tracking-widest text-xs font-black italic">Auto-Start Schedule</p>
          <div className="flex flex-wrap gap-2">
            {(['none', 'time', 'sunset', 'sunrise'] as ScheduleMode[]).map(mode => (
              <button 
                key={mode} 
                onClick={() => dispatch({ type: 'SET_SCHEDULE_MODE', payload: mode })}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg ${state.scheduleMode === mode ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-white'}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {state.scheduleMode !== 'none' && (
          <div className="space-y-8 animate-in slide-in-from-top-4 duration-300 bg-white/5 p-8 rounded-[2.5rem]">
            {state.scheduleMode === 'time' && (
              <div className="flex items-center gap-6">
                <label className="text-slate-500 text-[10px] font-black uppercase italic">Select Time</label>
                <input 
                  type="time" 
                  value={state.scheduleTime} 
                  onChange={(e) => dispatch({ type: 'SET_SCHEDULE_TIME', payload: e.target.value })} 
                  className="bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-2 text-white font-bold outline-none"
                />
              </div>
            )}
            <div className="space-y-4">
              <label className="text-slate-500 text-[10px] font-black uppercase italic">Recurrence</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(['daily', 'weekdays', 'weekends', 'weekly'] as Recurrence[]).map(rec => (
                  <button 
                    key={rec} 
                    onClick={() => dispatch({ type: 'SET_RECURRENCE', payload: rec })}
                    className={`py-3 rounded-2xl text-[10px] font-black uppercase transition-all italic border ${state.recurrence === rec ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' : 'bg-slate-800/50 text-slate-500 border-transparent'}`}
                  >
                    {rec}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <button 
        disabled={!isValid}
        onClick={handleGenerate} 
        className={`w-full font-black py-12 rounded-[4rem] text-4xl uppercase italic shadow-2xl transition-all ${isValid ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer active:scale-95' : 'bg-slate-800 text-slate-600 cursor-not-allowed grayscale'}`}
      >
        GENERATE TIMER
      </button>
      {!isValid && <p className="text-center text-red-500 font-black italic uppercase text-[10px] tracking-widest mt-4">Required fields missing or invalid</p>}
    </div>
  );
};
