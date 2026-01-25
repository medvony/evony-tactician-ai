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
    avatar?: string;
    provider?: string;
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

// Updated to match AI service expectations
export interface ChatMessage {
  role: 'user' | 'assistant' | 'model';  // Added 'assistant' for AI responses
  content: string;  // Changed from 'text' to 'content' for Groq compatibility
}
