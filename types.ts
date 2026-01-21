export type TroopType = 'Ground' | 'Ranged' | 'Mounted' | 'Siege';

export type Language = 'EN' | 'AR' | 'FR' | 'JA' | 'ES' | 'IT' | 'RU' | 'PT' | 'ZH' | 'DE';

export interface UserProfile {
  highestTiers: Record<TroopType, number>;
  marchSize: number;
  embassyCapacity: number;
  isSetup: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: {
    email?: string;
    name?: string;
    provider?: 'google' | 'facebook' | 'email';
  } | null;
}

export type ReportType = 'Attack' | 'Defense' | 'Alliance War' | 'Scout' | 'Monster' | 'Unknown';

export interface AnalysisResponse {
  reportType: ReportType;
  summary: string;
  recommendations: string;
  anonymizedData: string;
  sources?: Array<{ title: string; uri: string }>;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
