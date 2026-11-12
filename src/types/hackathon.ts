export type Language = 'ar' | 'en';

export interface JudgingRubric {
  id: string;
  name: { en: string; ar: string };
  weight: number; // Percentage, e.g., 25%
  description: { en: string; ar: string };
  whatJudgesLookFor: { en: string[]; ar: string[] };
  winningTips: { en: string[]; ar: string[] };
  redFlags: { en: string[]; ar: string[] };
}

export interface EligibilityCriterion {
  id: string;
  title: { en: string; ar: string };
  importance: 'CRITICAL' | 'MANDATORY' | 'RECOMMENDED';
  description: { en: string; ar: string };
  devpostRule: { en: string; ar: string };
}

export interface IdeaPreset {
  id: string;
  category: string;
  title: { en: string; ar: string };
  summary: { en: string; ar: string };
  paypalTech: { en: string; ar: string };
  aiTech: { en: string; ar: string };
  targetAudience: { en: string; ar: string };
  expectedImpact: { en: string; ar: string };
}

export interface EvaluationResult {
  overallScore: number;
  stageOneViability: {
    isViable: boolean;
    verdict: string;
    missingEssentials: string[];
  };
  rubrics: {
    name: string;
    score: number;
    analysis: string;
    winningRecommendation: string;
  }[];
  judgeCritique: string;
  firstPrizeBlueprint: string[];
}

export interface VideoScriptPhase {
  timeRange: string;
  phase: string;
  visual: string;
  narration: string;
}

export interface DevpostDossier {
  devpostFields: {
    tagline: string;
    inspiration: string;
    whatItDoes: string;
    howWeBuiltIt: string;
    challenges: string;
    accomplishments: string;
    whatWeLearned: string;
    whatsNext: string;
  };
  videoScript: VideoScriptPhase[];
}

export interface ChecklistItem {
  id: string;
  category: 'viability' | 'paypal' | 'video' | 'repository' | 'devpost';
  title: { en: string; ar: string };
  detail: { en: string; ar: string };
  checked: boolean;
  isMandatory: boolean;
}
