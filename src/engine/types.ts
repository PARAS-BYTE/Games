export type DifficultyTier = 'Easy' | 'Medium' | 'Hard' | 'Expert';

export interface GameMetrics {
  totalRounds: number;
  correctRounds: number;
  accuracy: number; // 0 - 100
  responseTimes: number[]; // ms
  avgResponseTime: number; // ms
  streak: number;
  maxStreak: number;
  score: number;
  currentLevel: number;
  tier: DifficultyTier;
}

export type GamePhase = 'intro' | 'playing' | 'feedback' | 'tally' | 'complete';

export interface GameInfo {
  id: string;
  title: string;
  tagline: string;
  category: 'Memory' | 'Logic' | 'Spatial' | 'Attention' | 'Mindful' | 'Language' | 'Emotional' | 'Analytical' | 'Precision';
  color: string;
  accentColor: string;
  description: string;
  iconName: string;
}
