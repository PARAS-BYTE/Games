import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { GameHeader } from '../../components/common/GameHeader';
import { ScoreTallyModal } from '../../components/common/ScoreTallyModal';
import { AdaptiveEngine } from '../../engine/AdaptiveEngine';
import type { GameMetrics } from '../../engine/types';
import { sounds } from '../../audio/soundEngine';

interface WordPuzzle {
  word: string;
  hint: string;
}

const WORDS_BY_LEVEL: Record<string, WordPuzzle[]> = {
  easy: [
    { word: 'CAT', hint: 'A friendly purring pet' },
    { word: 'SUN', hint: 'Shines brightly in daytime' },
    { word: 'BIRD', hint: 'Has feathers and sings songs' },
    { word: 'FISH', hint: 'Swims in rivers and oceans' },
  ],
  medium: [
    { word: 'PLANT', hint: 'Grows leaves in the soil' },
    { word: 'SMILE', hint: 'Shows happiness on your face' },
    { word: 'CLOUD', hint: 'Floats white and fluffy in the sky' },
    { word: 'RIVER', hint: 'Flowing body of fresh water' },
  ],
  hard: [
    { word: 'DOLPHIN', hint: 'Playful ocean swimmer' },
    { word: 'RAINBOW', hint: 'Colorful arc after a rain shower' },
    { word: 'BLOSSOM', hint: 'A lovely flower opening in spring' },
  ],
};

export const AnagramClimb: React.FC<{
  onBack: () => void;
  initialLevel?: number;
}> = ({ onBack, initialLevel = 1 }) => {
  const [metrics, setMetrics] = useState<GameMetrics>(() =>
    AdaptiveEngine.createInitialMetrics(initialLevel)
  );

  const [currentPuzzle, setCurrentPuzzle] = useState<WordPuzzle>(WORDS_BY_LEVEL.easy[0]);
  const [scrambledTiles, setScrambledTiles] = useState<{ id: number; letter: string }[]>([]);
  const [placedSlots, setPlacedSlots] = useState<{ id: number; letter: string }[]>([]);
  const [timeLeft, setTimeLeft] = useState(25);
  const [totalTime, setTotalTime] = useState(25);
  const [isWordComplete, setIsWordComplete] = useState(false);
  const [roundStartTime, setRoundStartTime] = useState(Date.now());
  const [isTallyOpen, setIsTallyOpen] = useState(false);
  const [lastRoundResult, setLastRoundResult] = useState({
    isCorrect: false,
    score: 0,
    levelShift: 0,
    newLevel: 1,
    timeMs: 0,
  });

  const timerRef = useRef<number | null>(null);

  const startNewRound = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTallyOpen(false);
    setIsWordComplete(false);
    setPlacedSlots([]);
    setRoundStartTime(Date.now());

    const pool =
      metrics.currentLevel <= 5
        ? WORDS_BY_LEVEL.easy
        : metrics.currentLevel <= 10
        ? WORDS_BY_LEVEL.medium
        : WORDS_BY_LEVEL.hard;

    const puzzle = pool[Math.floor(Math.random() * pool.length)];
    setCurrentPuzzle(puzzle);

    const letters = puzzle.word.split('').map((l, i) => ({ id: i, letter: l }));
    let scrambled = [...letters].sort(() => Math.random() - 0.5);
    while (scrambled.map((s) => s.letter).join('') === puzzle.word) {
      scrambled = [...letters].sort(() => Math.random() - 0.5);
    }
    setScrambledTiles(scrambled);

    const seconds = metrics.currentLevel <= 5 ? 30 : metrics.currentLevel <= 10 ? 22 : 16;
    setTotalTime(seconds);
    setTimeLeft(seconds);

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeout = () => {
    sounds.playIncorrect();
    const elapsed = totalTime * 1000;
    const { nextMetrics, levelShift, roundScore } = AdaptiveEngine.recordRound(
      metrics,
      false,
      elapsed
    );
    setMetrics(nextMetrics);
    setLastRoundResult({
      isCorrect: false,
      score: roundScore,
      levelShift,
      newLevel: nextMetrics.currentLevel,
      timeMs: elapsed,
    });
    setIsTallyOpen(true);
  };

  useEffect(() => {
    startNewRound();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [metrics.currentLevel]);

  const handleTileTap = (tile: { id: number; letter: string }) => {
    if (isWordComplete) return;
    sounds.playTap();

    setScrambledTiles((prev) => prev.filter((t) => t.id !== tile.id));
    const nextSlots = [...placedSlots, tile];
    setPlacedSlots(nextSlots);

    if (nextSlots.length === currentPuzzle.word.length) {
      const assembledWord = nextSlots.map((t) => t.letter).join('');
      const isCorrect = assembledWord === currentPuzzle.word;
      const elapsed = Date.now() - roundStartTime;

      if (isCorrect) {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsWordComplete(true);
        sounds.playCorrect();

        setTimeout(() => {
          const { nextMetrics, levelShift, roundScore } = AdaptiveEngine.recordRound(
            metrics,
            true,
            elapsed
          );
          setMetrics(nextMetrics);
          setLastRoundResult({
            isCorrect: true,
            score: roundScore,
            levelShift,
            newLevel: nextMetrics.currentLevel,
            timeMs: elapsed,
          });
          setIsTallyOpen(true);
        }, 700);
      } else {
        sounds.playIncorrect();
      }
    }
  };

  const handleSlotTap = (slot: { id: number; letter: string }) => {
    if (isWordComplete) return;
    sounds.playTap();
    setPlacedSlots((prev) => prev.filter((s) => s.id !== slot.id));
    setScrambledTiles((prev) => [...prev, slot]);
  };

  const handleResetSlots = () => {
    sounds.playTap();
    setScrambledTiles((prev) => [...prev, ...placedSlots]);
    setPlacedSlots([]);
  };

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / totalTime) * circumference;
  const timerColor = timeLeft > totalTime * 0.4 ? '#38B07D' : timeLeft > totalTime * 0.2 ? '#F5A623' : '#FF6565';

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '16px' }}>
      <GameHeader
        title="Anagram Climb"
        category="Language"
        themeColor="#2980B9"
        metrics={metrics}
        onBack={onBack}
      />

      <div
        className="toy-card"
        style={{
          padding: '36px 24px',
          textAlign: 'center',
          backgroundColor: '#FFFFFF',
          minHeight: '460px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ position: 'relative', width: '70px', height: '70px' }}>
            <svg width="70" height="70" viewBox="0 0 70 70">
              <circle
                cx="35"
                cy="35"
                r={radius}
                stroke="#EAE2D5"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="35"
                cy="35"
                r={radius}
                stroke={timerColor}
                strokeWidth="6"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 35 35)"
                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
              />
            </svg>
            <span
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontWeight: 800,
                fontSize: '1.1rem',
                color: timerColor,
              }}
            >
              {timeLeft}s
            </span>
          </div>

          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontSize: '1.4rem', color: '#2C3E50', margin: 0, fontWeight: 700 }}>
              Climb with the scrambled letters!
            </h2>
            <p style={{ color: '#7F8C8D', fontSize: '0.95rem', margin: 0 }}>
              Hint: <span style={{ color: '#2980B9', fontWeight: 700 }}>{currentPuzzle.hint}</span>
            </p>
          </div>
        </div>

        <div style={{ margin: '28px 0' }}>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {Array.from({ length: currentPuzzle.word.length }).map((_, index) => {
              const placed = placedSlots[index];
              return (
                <motion.div
                  key={index}
                  onClick={() => placed && handleSlotTap(placed)}
                  whileHover={{ scale: placed ? 1.05 : 1 }}
                  animate={{
                    y: isWordComplete ? [0, -12, 0] : 0,
                  }}
                  transition={{ delay: index * 0.04, duration: 0.35 }}
                  style={{
                    width: '60px',
                    height: '66px',
                    backgroundColor: placed ? '#2980B9' : '#FAF7F2',
                    color: '#FFFFFF',
                    border: `3px solid ${placed ? '#1B4F72' : '#E2D9CC'}`,
                    borderRadius: '16px',
                    boxShadow: placed ? '0 5px 0 #1B4F72' : 'inset 0 3px 6px rgba(0,0,0,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    cursor: placed ? 'pointer' : 'default',
                  }}
                >
                  {placed ? placed.letter : ''}
                </motion.div>
              );
            })}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
            {scrambledTiles.map((tile) => (
              <motion.button
                key={tile.id}
                onClick={() => handleTileTap(tile)}
                whileHover={{ scale: 1.1, y: -4 }}
                whileTap={{ scale: 0.92 }}
                className="btn-squishy btn-sun"
                style={{
                  width: '60px',
                  height: '66px',
                  fontSize: '1.8rem',
                  fontWeight: 800,
                  borderRadius: '16px',
                  padding: 0,
                }}
              >
                {tile.letter}
              </motion.button>
            ))}
          </div>

          {placedSlots.length > 0 && (
            <button
              onClick={handleResetSlots}
              className="btn-squishy btn-outline"
              style={{ padding: '6px 14px', fontSize: '0.85rem' }}
            >
              <RotateCcw size={14} />
              <span>Reset Tiles</span>
            </button>
          )}
        </div>
      </div>

      <ScoreTallyModal
        isOpen={isTallyOpen}
        isCorrect={lastRoundResult.isCorrect}
        roundScore={lastRoundResult.score}
        levelShift={lastRoundResult.levelShift}
        newLevel={lastRoundResult.newLevel}
        accuracy={metrics.accuracy}
        responseTimeMs={lastRoundResult.timeMs}
        onNextRound={startNewRound}
        onExitToMap={onBack}
      />
    </div>
  );
};
