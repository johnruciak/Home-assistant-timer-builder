
import { AppState, AppAction } from '../types';
import { DEFAULT_TIMER_DURATION } from '../constants/app';

const getSafeLocalStorage = (key: string): string => {
  try {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key) || '';
    }
  } catch (e) {
    console.warn('LocalStorage not available');
  }
  return '';
};

export const initialState: AppState = {
  isKeyConfigured: null,
  image: null,
  analysing: false,
  discovery: null,
  selectedEntity: null,
  customName: '',
  customEntityId: '',
  generating: false,
  yaml: null,
  error: null,
  showGuide: false,
  showListManager: false,
  listManagerTab: 'manual',
  duration: DEFAULT_TIMER_DURATION,
  scheduleMode: 'none',
  scheduleTime: '20:00',
  recurrence: 'daily',
  rawEntityList: getSafeLocalStorage('ha_entity_list'),
  quickSearch: '',
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_KEY_CONFIGURED': return { ...state, isKeyConfigured: action.payload };
    case 'SET_IMAGE': return { ...state, image: action.payload };
    case 'SET_ANALYSING': return { ...state, analysing: action.payload };
    case 'SET_DISCOVERY': return { ...state, discovery: action.payload };
    case 'SELECT_ENTITY': 
      return { 
        ...state, 
        selectedEntity: action.payload,
        customName: action.payload.name,
        customEntityId: action.payload.entityId,
        yaml: null, // Clear previous generation results
        error: null
      };
    case 'SET_CUSTOM_NAME': return { ...state, customName: action.payload };
    case 'SET_CUSTOM_ENTITY_ID': return { ...state, customEntityId: action.payload };
    case 'SET_GENERATING': return { ...state, generating: action.payload };
    case 'SET_YAML': return { ...state, yaml: action.payload };
    case 'SET_ERROR': return { ...state, error: action.payload };
    case 'SET_SHOW_GUIDE': return { ...state, showGuide: action.payload };
    case 'SET_SHOW_LIST_MANAGER': return { ...state, showListManager: action.payload };
    case 'SET_LIST_MANAGER_TAB': return { ...state, listManagerTab: action.payload };
    case 'SET_DURATION': return { ...state, duration: action.payload };
    case 'SET_SCHEDULE_MODE': return { ...state, scheduleMode: action.payload };
    case 'SET_SCHEDULE_TIME': return { ...state, scheduleTime: action.payload };
    case 'SET_RECURRENCE': return { ...state, recurrence: action.payload };
    case 'SET_RAW_ENTITY_LIST': 
      try {
        localStorage.setItem('ha_entity_list', action.payload);
      } catch (e) {}
      return { ...state, rawEntityList: action.payload };
    case 'SET_QUICK_SEARCH': return { ...state, quickSearch: action.payload };
    case 'RESET_APP': 
      return { 
        ...initialState, 
        isKeyConfigured: state.isKeyConfigured,
        rawEntityList: state.rawEntityList 
      };
    default: return state;
  }
}
