import type { DifficultyTier, GameMetrics } from './types';

export class AdaptiveEngine {
  public static getTierForLevel(level: number): DifficultyTier {
    if (level <= 5) return 'Easy';
    if (level <= 10) return 'Medium';
    if (level <= 15) return 'Hard';
    return 'Expert';
  }

  public static createInitialMetrics(startingLevel: number = 1): GameMetrics {
    return {
      totalRounds: 0,
      correctRounds: 0,
      accuracy: 100,
      responseTimes: [],
      avgResponseTime: 0,
      streak: 0,
      maxStreak: 0,
      score: 0,
      currentLevel: startingLevel,
      tier: this.getTierForLevel(startingLevel),
    };
  }

  public static recordRound(
    metrics: GameMetrics,
    isCorrect: boolean,
    responseTimeMs: number
  ): { nextMetrics: GameMetrics; levelShift: number; roundScore: number } {
    const totalRounds = metrics.totalRounds + 1;
    const correctRounds = metrics.correctRounds + (isCorrect ? 1 : 0);
    const accuracy = Math.round((correctRounds / totalRounds) * 100);

    const responseTimes = [...metrics.responseTimes, responseTimeMs];
    const avgResponseTime = Math.round(
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    );

    const streak = isCorrect ? metrics.streak + 1 : 0;
    const maxStreak = Math.max(metrics.maxStreak, streak);

    let roundScore = 0;
    if (isCorrect) {
      const speedBonus = Math.max(0, Math.floor((3500 - responseTimeMs) / 25));
      const streakMultiplier = 1 + Math.min(streak * 0.2, 1.5);
      roundScore = Math.round((100 + speedBonus) * streakMultiplier);
    } else {
      roundScore = 15;
    }

    const score = metrics.score + roundScore;

    let levelShift = 0;
    if (isCorrect) {
      if (streak >= 3 || (streak >= 2 && responseTimeMs < 1800)) {
        levelShift = 1;
      }
    } else {
      if (metrics.streak === 0 || accuracy < 60) {
        levelShift = metrics.currentLevel > 1 ? -1 : 0;
      }
    }

    const currentLevel = Math.max(1, metrics.currentLevel + levelShift);
    const tier = this.getTierForLevel(currentLevel);

    const nextMetrics: GameMetrics = {
      totalRounds,
      correctRounds,
      accuracy,
      responseTimes,
      avgResponseTime,
      streak,
      maxStreak,
      score,
      currentLevel,
      tier,
    };

    return { nextMetrics, levelShift, roundScore };
  }
}
