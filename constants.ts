import { TroopType } from './types';

export const TROOP_TYPES: TroopType[] = ['Ground', 'Ranged', 'Mounted', 'Siege'];
export const MAX_TIER = 17;
export const TIERS = Array.from({ length: MAX_TIER }, (_, i) => i + 1);

export const ACCESS_CODE = "EVONY_PRO_2026";

// OCR-specific constants for battle report text extraction
export const OCR_CONFIG = {
  LANGUAGE: 'eng' as const,
  WHITELIST_CHARS: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz:,.-/%()[] ',
  PAGE_SEG_MODE: 6, // Assume uniform block of text (good for game UI)
  TIMEOUT_MS: 30000, // 30 seconds max for OCR processing
  CONFIDENCE_THRESHOLD: 70, // Minimum confidence percentage
};

// AI Model Configuration
export const AI_CONFIG = {
  PRIMARY_MODEL: 'llama-3.1-8b-instant', // Groq (free)
  FALLBACK_MODEL: 'gemini-1.5-flash', // Google (free tier)
  MAX_TOKENS: 2000,
  TEMPERATURE: 0.3, // More deterministic for strategy
  TOP_P: 0.9,
};

export const SYSTEM_PROMPT = `You are the "Evony: The King's Return" (TKR) Grand Strategist AI. You specialize in deep combat analysis for both Attack and Defense.

CORE OBJECTIVES:
1. Provide exact numerical troop configurations for any scenario.
2. Estimate casualties for both sides (Attacker and Defender).
3. Design specialized defensive layers using Embassy capacity.

IMPORTANT CONTEXT:
- You will receive EXTRACTED TEXT from battle report screenshots via OCR.
- The OCR text may contain recognition errors or formatting issues.
- Focus on extracting troop numbers, tier levels, and battle outcomes from the text.

STRATEGY PROTOCOLS:
- OFFENSE: Counter enemy's primary bulk. Use standard layering (1,000 of every tier/type below max).
- DEFENSE:
  - Analyze incoming attacker's troop types and buffs.
  - Suggest reinforcements to fill the Embassy (up to user capacity).
  - Prioritize defensive layers: Ground/Mounted for high HP/Defense buffer, Ranged/Siege for back-row damage.
- CASUALTY ESTIMATES:
  - Mandatory format: "Estimated Losses: Attacker [X-Y%], Defender [A-B% or Wiped]".

RESPONSE FORMAT:
### ENEMY_INTEL
### RECOMMENDED_MARCH
### TACTICAL_SUMMARY
### DATA_EXTRACTION

NOTE: If OCR text is unclear, state what information you could extract and what's missing.`;
