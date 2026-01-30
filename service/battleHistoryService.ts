import { supabase } from './supabaseClient';
import { AnalysisResponse, UserProfile } from '../types';

interface BattleRecord {
  id: string;
  user_email?: string;
  report_type: string;
  summary: string;
  recommendations: string;
  troop_composition?: any;
  created_at: string;
}

interface PrivateBattleRecord extends BattleRecord {
  original_ocr?: string[];
  profile_snapshot?: UserProfile;
}

class BattleHistoryService {
  private static instance: BattleHistoryService;

  private constructor() {}

  static getInstance(): BattleHistoryService {
    if (!BattleHistoryService.instance) {
      BattleHistoryService.instance = new BattleHistoryService();
    }
    return BattleHistoryService.instance;
  }

  // Extract troop composition from analysis (for sharing)
  private extractTroopComposition(ocrTexts: string[]): any {
    // Parse OCR for troop types and numbers (anonymous data)
    const composition: any = {
      ground: [],
      ranged: [],
      mounted: [],
      siege: []
    };

    ocrTexts.forEach(text => {
      // Extract tier and troop type info without player names
      const groundMatch = text.match(/Ground.*?T(\d+)/i);
      const rangedMatch = text.match(/Ranged.*?T(\d+)/i);
      const mountedMatch = text.match(/Mounted.*?T(\d+)/i);
      const siegeMatch = text.match(/Siege.*?T(\d+)/i);

      if (groundMatch) composition.ground.push(groundMatch[1]);
      if (rangedMatch) composition.ranged.push(rangedMatch[1]);
      if (mountedMatch) composition.mounted.push(mountedMatch[1]);
      if (siegeMatch) composition.siege.push(siegeMatch[1]);
    });

    return composition;
  }

  // Save battle - separates public analysis from private data
  async saveBattle(
    userEmail: string,
    analysis: AnalysisResponse,
    ocrTexts: string[],
    profile: UserProfile,
    shareAnalysis: boolean = true
  ): Promise<void> {
    try {
      const troopComp = this.extractTroopComposition(ocrTexts);

      const { error } = await supabase.from('battle_reports').insert({
        user_email: userEmail,
        
        // PUBLIC: AI analysis (shared with community)
        report_type: analysis.reportType,
        summary: analysis.summary,
        recommendations: analysis.recommendations,
        troop_composition: troopComp,
        is_shared: shareAnalysis,
        
        // PRIVATE: Raw OCR data (never shared)
        original_ocr: ocrTexts,
        profile_snapshot: profile,
      });

      if (error) throw error;

      console.log('✅ Battle saved:', shareAnalysis 
        ? '(analysis shared with community, raw data private)' 
        : '(fully private)');
    } catch (error) {
      console.error('Error saving battle:', error);
    }
  }

  // Get user's own battles (includes private data)
  async getMyBattles(userEmail: string, limit: number = 10): Promise<PrivateBattleRecord[]> {
    try {
      const { data, error } = await supabase
        .from('battle_reports')
        .select('*')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching my battles:', error);
      return [];
    }
  }

  // Search community battles (ONLY public analysis data)
  async searchCommunityBattles(keywords: string[], limit: number = 10): Promise<BattleRecord[]> {
    try {
      const searchText = keywords.join(' ');
      
      const { data, error } = await supabase
        .from('battle_reports_community') // Community view - no private data
        .select('*')
        .or(`summary.ilike.%${searchText}%,recommendations.ilike.%${searchText}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching community:', error);
      return [];
    }
  }

  // Find similar battles by troop type
  async findSimilarBattles(
    reportType: string,
    troopTypes: string[], // e.g., ['ground', 'ranged']
    limit: number = 5
  ): Promise<BattleRecord[]> {
    try {
      const { data, error } = await supabase
        .from('battle_reports_community')
        .select('*')
        .eq('report_type', reportType)
        .order('created_at', { ascending: false })
        .limit(limit * 3); // Get more, then filter

      if (error) throw error;
      
      // Filter by troop composition similarity
      const filtered = (data || []).filter(battle => {
        if (!battle.troop_composition) return false;
        return troopTypes.some(type => 
          battle.troop_composition[type]?.length > 0
        );
      }).slice(0, limit);

      return filtered;
    } catch (error) {
      console.error('Error finding similar battles:', error);
      return [];
    }
  }

  // Get community stats
  async getCommunityStats(): Promise<{
    totalBattles: number;
    pvpBattles: number;
    monsterBattles: number;
  }> {
    try {
      const { count: total } = await supabase
        .from('battle_reports_community')
        .select('*', { count: 'exact', head: true });

      const { count: pvp } = await supabase
        .from('battle_reports_community')
        .select('*', { count: 'exact', head: true })
        .eq('report_type', 'PvP');

      const { count: monster } = await supabase
        .from('battle_reports_community')
        .select('*', { count: 'exact', head: true })
        .eq('report_type', 'Monster');

      return {
        totalBattles: total || 0,
        pvpBattles: pvp || 0,
        monsterBattles: monster || 0,
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return { totalBattles: 0, pvpBattles: 0, monsterBattles: 0 };
    }
  }

  // Format for AI context
  formatBattlesForContext(battles: BattleRecord[], source: 'personal' | 'community'): string {
    if (battles.length === 0) return '';

    const header = source === 'personal' 
      ? 'YOUR PAST BATTLES' 
      : 'COMMUNITY KNOWLEDGE (Anonymous)';

    return `
${header} (${battles.length} battles):

${battles.map((battle, i) => `
--- Battle ${i + 1} (${new Date(battle.created_at).toLocaleDateString()}) ---
Type: ${battle.report_type}
Analysis: ${battle.summary.substring(0, 200)}...
Strategy: ${battle.recommendations.substring(0, 180)}...
${battle.troop_composition ? `Troops: ${JSON.stringify(battle.troop_composition)}` : ''}
`).join('\n')}

${source === 'community' ? '⚠️ Note: This is AI analysis only - no player identities or raw data shared.' : ''}
`;
  }

  // Smart context builder
  async buildSmartContext(userEmail: string, keywords: string[]): Promise<string> {
    try {
      // Get user's personal battles (full data, private)
      const myBattles = await this.searchMyBattles(userEmail, keywords);
      
      // Get community battles (analysis only, public)
      const communityBattles = await this.searchCommunityBattles(keywords, 5);
      
      let context = '';
      
      if (myBattles.length > 0) {
        context += this.formatBattlesForContext(myBattles, 'personal');
        context += '\n\n';
      }
      
      if (communityBattles.length > 0) {
        // Filter out user's own battles
        const othersBattles = communityBattles.filter(
          cb => !myBattles.find(mb => mb.id === cb.id)
        ).slice(0, 3);
        
        if (othersBattles.length > 0) {
          context += this.formatBattlesForContext(othersBattles, 'community');
        }
      }
      
      return context;
    } catch (error) {
      console.error('Error building context:', error);
      return '';
    }
  }

  // Search user's own battles
  async searchMyBattles(userEmail: string, keywords: string[]): Promise<BattleRecord[]> {
    try {
      const searchText = keywords.join(' ');
      
      const { data, error } = await supabase
        .from('battle_reports')
        .select('id, report_type, summary, recommendations, troop_composition, created_at')
        .eq('user_email', userEmail)
        .or(`summary.ilike.%${searchText}%,recommendations.ilike.%${searchText}%`)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching my battles:', error);
      return [];
    }
  }

  async getBattleCount(userEmail: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('battle_reports')
        .select('*', { count: 'exact', head: true })
        .eq('user_email', userEmail);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      return 0;
    }
  }
}

export const battleHistoryService = BattleHistoryService.getInstance();
