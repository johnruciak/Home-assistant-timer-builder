
export interface DiscoveredEntity {
  entityId: string;
  name: string;
  type: 'switch' | 'light' | 'valve' | 'fan' | 'climate' | 'vacuum' | 'media_player' | 'cover' | 'other';
  icon?: string;
}

export interface DiscoveryResult {
  entities: DiscoveredEntity[];
  explanation: string;
}

export type ScheduleMode = 'none' | 'time' | 'sunset' | 'sunrise';
export type Recurrence = 'daily' | 'weekdays' | 'weekends' | 'weekly';

export interface AppState {
  isKeyConfigured: boolean | null;
  image: string | null;
  analysing: boolean;
  discovery: DiscoveryResult | null;
  selectedEntity: DiscoveredEntity | null;
  customName: string;
  customEntityId: string;
  generating: boolean;
  yaml: { package: string; dashboard: string } | null;
  error: string | null;
  showGuide: boolean;
  showListManager: boolean;
  listManagerTab: 'card' | 'json' | 'manual';
  duration: number;
  scheduleMode: ScheduleMode;
  scheduleTime: string;
  recurrence: Recurrence;
  rawEntityList: string;
  quickSearch: string;
}

export type AppAction =
  | { type: 'SET_KEY_CONFIGURED'; payload: boolean | null }
  | { type: 'SET_IMAGE'; payload: string | null }
  | { type: 'SET_ANALYSING'; payload: boolean }
  | { type: 'SET_DISCOVERY'; payload: DiscoveryResult | null }
  | { type: 'SELECT_ENTITY'; payload: DiscoveredEntity }
  | { type: 'SET_CUSTOM_NAME'; payload: string }
  | { type: 'SET_CUSTOM_ENTITY_ID'; payload: string }
  | { type: 'SET_GENERATING'; payload: boolean }
  | { type: 'SET_YAML'; payload: { package: string; dashboard: string } | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SHOW_GUIDE'; payload: boolean }
  | { type: 'SET_SHOW_LIST_MANAGER'; payload: boolean }
  | { type: 'SET_LIST_MANAGER_TAB'; payload: 'card' | 'json' | 'manual' }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_SCHEDULE_MODE'; payload: ScheduleMode }
  | { type: 'SET_SCHEDULE_TIME'; payload: string }
  | { type: 'SET_RECURRENCE'; payload: Recurrence }
  | { type: 'SET_RAW_ENTITY_LIST'; payload: string }
  | { type: 'SET_QUICK_SEARCH'; payload: string }
  | { type: 'RESET_APP' };
