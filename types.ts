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

// UPDATED: Backward compatible ChatMessage
export interface ChatMessage {
  role: 'user' | 'assistant' | 'model';
  content: string;
  // For backward compatibility - existing code can still use .text
  text?: string;
}

// Helper function for converting messages
export function prepareMessageForAI(message: ChatMessage): { role: string; content: string } {
  return {
    role: message.role === 'model' ? 'assistant' : message.role,
    content: message.content || message.text || '' // Uses .content first, falls back to .text
  };
}
