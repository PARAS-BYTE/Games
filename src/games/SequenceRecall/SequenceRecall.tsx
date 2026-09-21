import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameHeader } from '../../components/common/GameHeader';
import { ScoreTallyModal } from '../../components/common/ScoreTallyModal';
import { AdaptiveEngine } from '../../engine/AdaptiveEngine';
import type { GameMetrics } from '../../engine/types';
import { sounds } from '../../audio/soundEngine';

interface TileData {
  id: number;
  label: string;
  color: string;
  lightColor: string;
  freq: number;
  svgIcon: React.ReactNode;
}

const BASE_TILES: TileData[] = [
  {
    id: 0,
    label: 'Sun',
    color: '#F5A623',
    lightColor: '#FEF7E6',
    freq: 523.25,
    svgIcon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 1,
    label: 'Leaf',
    color: '#38B07D',
    lightColor: '#E8F8F0',
    freq: 587.33,
    svgIcon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 2,
    label: 'Drop',
    color: '#3CA2FF',
    lightColor: '#EBF5FF',
    freq: 659.25,
    svgIcon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    ),
  },
  {
    id: 3,
    label: 'Berry',
    color: '#FF6565',
    lightColor: '#FFF0F0',
    freq: 783.99,
    svgIcon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="14" r="7" />
        <path d="M12 7V3M9 5l6-2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 4,
    label: 'Moon',
    color: '#9B59B6',
    lightColor: '#F7EEFA',
    freq: 880.0,
    svgIcon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
  },
  {
    id: 5,
    label: 'Flower',
    color: '#1ABC9C',
    lightColor: '#E3F8F4',
    freq: 1046.5,
    svgIcon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="3" />
        <circle cx="12" cy="6" r="3" opacity="0.8" />
        <circle cx="12" cy="18" r="3" opacity="0.8" />
        <circle cx="6" cy="12" r="3" opacity="0.8" />
        <circle cx="18" cy="12" r="3" opacity="0.8" />
      </svg>
    ),
  },
];

interface SequenceRecallProps {
  onBack: () => void;
  initialLevel?: number;
}

export const SequenceRecall: React.FC<SequenceRecallProps> = ({
  onBack,
  initialLevel = 1,
}) => {
  const [metrics, setMetrics] = useState<GameMetrics>(() =>
    AdaptiveEngine.createInitialMetrics(initialLevel)
  );
  const [tiles, setTiles] = useState<TileData[]>(BASE_TILES.slice(0, 4));
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [activeTileId, setActiveTileId] = useState<number | null>(null);
  const [isWrongWobble, setIsWrongWobble] = useState(false);
  const [isSuccessGlow, setIsSuccessGlow] = useState(false);
  const [roundStartTime, setRoundStartTime] = useState<number>(Date.now());
  const [isTallyOpen, setIsTallyOpen] = useState(false);
  const [lastRoundResult, setLastRoundResult] = useState({
    isCorrect: false,
    score: 0,
    levelShift: 0,
    newLevel: 1,
    timeMs: 0,
  });

  const isReverseMode = metrics.currentLevel >= 11;
  const timerRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timerRef.current.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    let count = 4;
    if (metrics.currentLevel >= 6) count = 5;
    if (metrics.currentLevel >= 11) count = 6;
    setTiles(BASE_TILES.slice(0, count));
  }, [metrics.currentLevel]);

  const startNewRound = () => {
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
    setPlayerInput([]);
    setIsWrongWobble(false);
    setIsSuccessGlow(false);
    setIsTallyOpen(false);

    const seqLength = Math.min(3 + Math.floor((metrics.currentLevel - 1) / 2), 12);
    const newSeq: number[] = [];
    for (let i = 0; i < seqLength; i++) {
      newSeq.push(Math.floor(Math.random() * tiles.length));
    }
    setSequence(newSeq);

    const pace = metrics.currentLevel <= 5 ? 750 : metrics.currentLevel <= 10 ? 550 : 420;

    setIsPlayingSequence(true);
    newSeq.forEach((tileIdx, step) => {
      const startTimer = window.setTimeout(() => {
        const tile = tiles[tileIdx];
        if (tile) {
          setActiveTileId(tile.id);
          sounds.playNote(tile.freq, 0.35);
        }
      }, (step + 1) * pace);

      const endTimer = window.setTimeout(() => {
        setActiveTileId(null);
      }, (step + 1) * pace + 300);

      timerRef.current.push(startTimer, endTimer);
    });

    const finishTimer = window.setTimeout(() => {
      setIsPlayingSequence(false);
      setRoundStartTime(Date.now());
    }, (newSeq.length + 1) * pace + 100);

    timerRef.current.push(finishTimer);
  };

  useEffect(() => {
    startNewRound();
  }, [tiles.length, metrics.currentLevel]);

  const handleTileClick = (tileId: number) => {
    if (isPlayingSequence || isWrongWobble || isSuccessGlow) return;

    const tile = tiles.find((t) => t.id === tileId);
    if (tile) {
      sounds.playNote(tile.freq, 0.25);
    }

    const nextInput = [...playerInput, tileId];
    setPlayerInput(nextInput);

    const expectedSequence = isReverseMode ? [...sequence].reverse() : sequence;
    const currentIndex = playerInput.length;

    if (tileId !== expectedSequence[currentIndex]) {
      sounds.playIncorrect();
      setIsWrongWobble(true);
      const elapsed = Date.now() - roundStartTime;

      setTimeout(() => {
        setIsWrongWobble(false);
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
      }, 500);
      return;
    }

    if (nextInput.length === sequence.length) {
      const elapsed = Date.now() - roundStartTime;
      setIsSuccessGlow(true);
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
      }, 600);
    }
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '16px' }}>
      <GameHeader
        title="Sequence Recall"
        category="Memory"
        themeColor="#38B07D"
        metrics={metrics}
        onBack={onBack}
      />

      <div
        className={`toy-card ${isWrongWobble ? 'anim-gentle-shake' : ''}`}
        style={{
          padding: '36px 24px',
          textAlign: 'center',
          backgroundColor: '#FFFFFF',
          minHeight: '440px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div style={{ marginBottom: '28px' }}>
          {isReverseMode && (
            <div
              style={{
                display: 'inline-block',
                padding: '4px 14px',
                borderRadius: '999px',
                backgroundColor: '#FFF0F0',
                color: '#D44242',
                fontWeight: 700,
                fontSize: '0.85rem',
                marginBottom: '8px',
              }}
            >
              Reverse Mode: Repeat in Opposite Order!
            </div>
          )}
          <h2 style={{ fontSize: '1.5rem', color: '#2C3E50', margin: 0, fontWeight: 700 }}>
            {isPlayingSequence
              ? 'Watch and listen carefully...'
              : `Your Turn! Tap ${sequence.length - playerInput.length} more`}
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: tiles.length > 4 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
            gap: '20px',
            maxWidth: '380px',
            width: '100%',
          }}
        >
          {tiles.map((tile) => {
            const isActive = activeTileId === tile.id;
            return (
              <motion.button
                key={tile.id}
                onClick={() => handleTileClick(tile.id)}
                disabled={isPlayingSequence}
                whileHover={{ scale: isPlayingSequence ? 1 : 1.05 }}
                whileTap={{ scale: 0.92 }}
                animate={{
                  scale: isActive || isSuccessGlow ? 1.12 : 1,
                  filter:
                    isActive || isSuccessGlow
                      ? `drop-shadow(0 0 16px ${tile.color})`
                      : 'drop-shadow(0 4px 6px rgba(0,0,0,0.06))',
                }}
                transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                style={{
                  height: '110px',
                  borderRadius: '28px',
                  border: `4px solid ${isActive ? '#FFFFFF' : tile.color}`,
                  backgroundColor: isActive ? tile.color : tile.lightColor,
                  color: isActive ? '#FFFFFF' : tile.color,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: isPlayingSequence ? 'default' : 'pointer',
                  boxShadow: `0 6px 0 ${tile.color}88`,
                }}
              >
                {tile.svgIcon}
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{tile.label}</span>
              </motion.button>
            );
          })}
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
