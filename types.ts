
export interface DiscoveredEntity {
  entityId: string;
  name: string;
  type: 'switch' | 'light' | 'valve' | 'fan' | 'other';
  icon?: string;
}

export interface DiscoveryResult {
  entities: DiscoveredEntity[];
  explanation: string;
}

export interface AutomationConfig {
  deviceName: string;
  entityId: string;
  durationMinutes: number;
  includeSafetyTimer: boolean;
  includeDashboardHelper: boolean;
}
