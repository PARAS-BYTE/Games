import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameHeader } from '../../components/common/GameHeader';
import { ScoreTallyModal } from '../../components/common/ScoreTallyModal';
import { AdaptiveEngine } from '../../engine/AdaptiveEngine';
import type { GameMetrics } from '../../engine/types';
import { sounds } from '../../audio/soundEngine';

interface ColorItem {
  name: string;
  hex: string;
  buttonColorClass: string;
}

const COLOR_PALETTE: ColorItem[] = [
  { name: 'RED', hex: '#FF6565', buttonColorClass: 'btn-coral' },
  { name: 'BLUE', hex: '#3CA2FF', buttonColorClass: 'btn-sky' },
  { name: 'GREEN', hex: '#38B07D', buttonColorClass: 'btn-mint' },
  { name: 'YELLOW', hex: '#F5A623', buttonColorClass: 'btn-sun' },
  { name: 'PURPLE', hex: '#9B59B6', buttonColorClass: 'btn-lavender' },
];

export const StroopAttention: React.FC<{
  onBack: () => void;
  initialLevel?: number;
}> = ({ onBack, initialLevel = 1 }) => {
  const [metrics, setMetrics] = useState<GameMetrics>(() =>
    AdaptiveEngine.createInitialMetrics(initialLevel)
  );

  const [wordText, setWordText] = useState('BLUE');
  const [inkColor, setInkColor] = useState<ColorItem>(COLOR_PALETTE[0]);
  const [availableColors, setAvailableColors] = useState<ColorItem[]>(COLOR_PALETTE.slice(0, 3));
  const [isWrongWobble, setIsWrongWobble] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3.0);
  const [maxTime, setMaxTime] = useState(3.0);
  const [roundStartTime, setRoundStartTime] = useState<number>(Date.now());
  const [isTallyOpen, setIsTallyOpen] = useState(false);
  const [lastRoundResult, setLastRoundResult] = useState({
    isCorrect: false,
    score: 0,
    levelShift: 0,
    newLevel: 1,
    timeMs: 0,
  });

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let count = 3;
    let timeLimit = 3.0;

    if (metrics.currentLevel >= 6) {
      count = 4;
      timeLimit = 2.0;
    }
    if (metrics.currentLevel >= 11) {
      count = 5;
      timeLimit = 1.3;
    }
    if (metrics.currentLevel >= 16) {
      count = 5;
      timeLimit = 0.9;
    }

    setAvailableColors(COLOR_PALETTE.slice(0, count));
    setMaxTime(timeLimit);
    setTimeLeft(timeLimit);
  }, [metrics.currentLevel]);

  const startNewRound = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTallyOpen(false);
    setIsWrongWobble(false);

    const pool = availableColors.length > 0 ? availableColors : COLOR_PALETTE.slice(0, 3);
    const wordObj = pool[Math.floor(Math.random() * pool.length)];
    const inkObj = pool[Math.floor(Math.random() * pool.length)];

    setWordText(wordObj.name);
    setInkColor(inkObj);
    setTimeLeft(maxTime);
    setRoundStartTime(Date.now());

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.08) {
          clearInterval(timerRef.current!);
          handleTimeout();
          return 0;
        }
        return prev - 0.05;
      });
    }, 50);
  };

  const handleTimeout = () => {
    sounds.playIncorrect();
    setIsWrongWobble(true);
    const elapsed = Math.round(maxTime * 1000);

    setTimeout(() => {
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
    }, 400);
  };

  useEffect(() => {
    startNewRound();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [availableColors.length, metrics.currentLevel]);

  const handleColorChoice = (color: ColorItem) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const elapsed = Date.now() - roundStartTime;
    const isCorrect = color.name === inkColor.name;

    if (isCorrect) {
      sounds.playCorrect();
    } else {
      sounds.playIncorrect();
      setIsWrongWobble(true);
    }

    setTimeout(() => {
      const { nextMetrics, levelShift, roundScore } = AdaptiveEngine.recordRound(
        metrics,
        isCorrect,
        elapsed
      );
      setMetrics(nextMetrics);
      setLastRoundResult({
        isCorrect,
        score: roundScore,
        levelShift,
        newLevel: nextMetrics.currentLevel,
        timeMs: elapsed,
      });
      setIsTallyOpen(true);
    }, 500);
  };

  const timerPercent = Math.max(0, Math.min(100, (timeLeft / maxTime) * 100));

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '16px' }}>
      <GameHeader
        title="Stroop Attention"
        category="Attention"
        themeColor="#FF6565"
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
        <div>
          <h2 style={{ fontSize: '1.4rem', color: '#2C3E50', marginBottom: '6px', fontWeight: 700 }}>
            Tap the INK COLOR, not the word!
          </h2>
          <p style={{ color: '#7F8C8D', fontSize: '0.95rem', margin: 0 }}>
            Don't let your eyes play tricks on you!
          </p>
        </div>

        <div
          style={{
            width: '100%',
            maxWidth: '360px',
            height: '14px',
            backgroundColor: '#F0EAE1',
            borderRadius: '999px',
            overflow: 'hidden',
            border: '2px solid #E5DDCF',
            margin: '20px 0',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${timerPercent}%`,
              backgroundColor: timerPercent > 35 ? '#38B07D' : '#FF6565',
              transition: 'width 0.05s linear',
              borderRadius: '999px',
            }}
          />
        </div>

        <div style={{ minHeight: '130px', display: 'flex', alignItems: 'center' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={wordText + inkColor.hex}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                rotate: metrics.currentLevel >= 11 ? (isWrongWobble ? [-5, 5, 0] : [0, 2, -2, 0]) : 0,
              }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', damping: 14, stiffness: 260 }}
              style={{
                fontSize: '3.6rem',
                fontWeight: 900,
                color: inkColor.hex,
                letterSpacing: '2px',
                textShadow: '0 4px 10px rgba(0,0,0,0.06)',
              }}
            >
              {wordText}
            </motion.div>
          </AnimatePresence>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '14px',
            maxWidth: '480px',
            width: '100%',
            marginTop: '20px',
          }}
        >
          {availableColors.map((color) => (
            <motion.button
              key={color.name}
              onClick={() => handleColorChoice(color)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              className={`btn-squishy ${color.buttonColorClass}`}
              style={{
                padding: '14px 28px',
                fontSize: '1.05rem',
                minWidth: '120px',
              }}
            >
              <span>{color.name}</span>
            </motion.button>
          ))}
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
