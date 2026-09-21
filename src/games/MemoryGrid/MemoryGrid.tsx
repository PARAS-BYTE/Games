import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameHeader } from '../../components/common/GameHeader';
import { GameCompletionModal } from '../../components/common/GameCompletionModal';
import { AdaptiveEngine } from '../../engine/AdaptiveEngine';
import type { GameMetrics } from '../../engine/types';
import { sounds } from '../../audio/soundEngine';
import { CrystalGrid3D } from '../../components/3d/CrystalGrid3D';

interface MemoryGridProps {
  onBack: () => void;
  initialLevel?: number;
}

export const MemoryGrid: React.FC<MemoryGridProps> = ({
  onBack,
  initialLevel = 1,
}) => {
  const TOTAL_ROUNDS = 10;
  const [currentRound, setCurrentRound] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const [metrics, setMetrics] = useState<GameMetrics>(() =>
    AdaptiveEngine.createInitialMetrics(initialLevel)
  );

  // Dynamic difficulty scaling across 10 rounds
  const gridSize = currentRound <= 2 ? 3 : currentRound <= 6 ? 4 : 5;
  const rotationAngle = currentRound >= 9 ? 270 : currentRound >= 7 ? 180 : currentRound >= 5 ? 90 : 0;
  const shouldRotate = rotationAngle > 0;

  const [highlightedCells, setHighlightedCells] = useState<number[]>([]);
  const [selectedCells, setSelectedCells] = useState<number[]>([]);
  const [phase, setPhase] = useState<'memorize' | 'recall' | 'evaluating'>('memorize');
  const [viewTimeRemaining, setViewTimeRemaining] = useState<number>(3);
  const [isRotating, setIsRotating] = useState(false);
  const [roundStartTime, setRoundStartTime] = useState<number>(Date.now());
  const [feedbackNotice, setFeedbackNotice] = useState<{ text: string; isSuccess: boolean } | null>(null);

  const startRound = (roundNum: number) => {
    setSelectedCells([]);
    setFeedbackNotice(null);
    setPhase('memorize');
    setIsRotating(false);

    const gSize = roundNum <= 2 ? 3 : roundNum <= 6 ? 4 : 5;
    const tCount = roundNum <= 2 ? 3 : roundNum <= 4 ? 4 : roundNum <= 6 ? 5 : roundNum <= 8 ? 6 : 8;
    const rAngle = roundNum >= 9 ? 270 : roundNum >= 7 ? 180 : roundNum >= 5 ? 90 : 0;

    const total = gSize * gSize;
    const targets = new Set<number>();
    while (targets.size < tCount) {
      targets.add(Math.floor(Math.random() * total));
    }
    const targetArr = Array.from(targets);
    setHighlightedCells(targetArr);

    const initialSeconds = roundNum <= 2 ? 3.0 : roundNum <= 5 ? 2.4 : roundNum <= 8 ? 2.0 : 1.8;
    setViewTimeRemaining(initialSeconds);

    let timeLeft = initialSeconds;
    const interval = setInterval(() => {
      timeLeft -= 0.5;
      setViewTimeRemaining(Math.max(0, timeLeft));
      if (timeLeft <= 0) {
        clearInterval(interval);
        if (rAngle > 0) {
          setIsRotating(true);
          setTimeout(() => {
            setPhase('recall');
            setRoundStartTime(Date.now());
          }, 650);
        } else {
          setPhase('recall');
          setRoundStartTime(Date.now());
        }
      }
    }, 500);
  };

  useEffect(() => {
    startRound(1);
  }, []);

  const handleCellClick = (cellIndex: number) => {
    if (phase !== 'recall' || selectedCells.includes(cellIndex) || feedbackNotice) return;

    sounds.playTap();
    const isTarget = highlightedCells.includes(cellIndex);
    const nextSelected = [...selectedCells, cellIndex];
    setSelectedCells(nextSelected);

    // 1 CHANCE RULE: If wrong tile is clicked, immediate strike and advance!
    if (!isTarget) {
      setPhase('evaluating');
      sounds.playIncorrect();
      setFeedbackNotice({ text: '1 Chance Used! Incorrect Tile', isSuccess: false });
      const elapsed = Date.now() - roundStartTime;
      const { nextMetrics } = AdaptiveEngine.recordRound(metrics, false, elapsed);
      setMetrics(nextMetrics);

      setTimeout(() => {
        if (currentRound >= TOTAL_ROUNDS) {
          setIsCompleted(true);
        } else {
          const nextR = currentRound + 1;
          setCurrentRound(nextR);
          startRound(nextR);
        }
      }, 950);
      return;
    }

    // If all correct cells identified:
    if (nextSelected.length === highlightedCells.length) {
      setPhase('evaluating');
      const elapsed = Date.now() - roundStartTime;
      sounds.playCorrect();
      setCorrectCount((c) => c + 1);
      const points = currentRound >= 8 ? 160 : currentRound >= 5 ? 130 : 100;
      setFeedbackNotice({ text: `+${points} pts! Flawless Recall!`, isSuccess: true });

      const { nextMetrics } = AdaptiveEngine.recordRound(metrics, true, elapsed);
      setMetrics(nextMetrics);

      // Continuous flow: advance smoothly to next round after 950ms
      setTimeout(() => {
        if (currentRound >= TOTAL_ROUNDS) {
          setIsCompleted(true);
        } else {
          const nextR = currentRound + 1;
          setCurrentRound(nextR);
          startRound(nextR);
        }
      }, 950);
    }
  };

  const handlePlayAgain = () => {
    setCurrentRound(1);
    setCorrectCount(0);
    setIsCompleted(false);
    setMetrics(AdaptiveEngine.createInitialMetrics(1));
    startRound(1);
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '8px 16px', maxHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <GameHeader
        title="3D Memory Crystal Grid"
        category="Spatial"
        themeColor="#3CA2FF"
        metrics={{ ...metrics, totalRounds: currentRound - 1 }}
        onBack={onBack}
      />

      <div
        className="toy-card"
        style={{
          padding: '14px 20px',
          textAlign: 'center',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <AnimatePresence>
          {feedbackNotice && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                top: '8px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: feedbackNotice.isSuccess ? '#E8F8F0' : '#FFF0F0',
                color: feedbackNotice.isSuccess ? '#248259' : '#D44242',
                border: `2px solid ${feedbackNotice.isSuccess ? '#38B07D' : '#FF6565'}`,
                padding: '6px 20px',
                borderRadius: '999px',
                fontWeight: 800,
                fontSize: '0.95rem',
                zIndex: 20,
                boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
              }}
            >
              {feedbackNotice.text}
            </motion.div>
          )}
        </AnimatePresence>

        <CrystalGrid3D activeCount={highlightedCells.length} />

        <div style={{ margin: '6px 0 12px' }}>
          {shouldRotate && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                display: 'inline-block',
                padding: '4px 14px',
                borderRadius: '999px',
                backgroundColor: rotationAngle >= 180 ? '#FCE4EC' : '#EBF5FF',
                color: rotationAngle >= 180 ? '#C2185B' : '#1E74C4',
                fontWeight: 800,
                fontSize: '0.85rem',
                marginBottom: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}
            >
              {rotationAngle === 90 && 'Perspective Shift: 3D Grid rotates 90°!'}
              {rotationAngle === 180 && 'Expert Challenge: 180° Complete Inversion!'}
              {rotationAngle === 270 && 'Master Shift: 270° Counter-Clockwise Warp!'}
            </motion.div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                padding: '2px 10px',
                borderRadius: '999px',
                backgroundColor: currentRound <= 2 ? '#E8F8F0' : currentRound <= 5 ? '#FEF7E6' : '#FDEDEC',
                color: currentRound <= 2 ? '#248259' : currentRound <= 5 ? '#C97E06' : '#C0392B',
                textTransform: 'uppercase',
              }}
            >
              {currentRound <= 2 ? 'Easy Tier' : currentRound <= 5 ? 'Medium Tier' : currentRound <= 8 ? 'Hard Tier' : 'Expert Tier'}
            </span>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                padding: '2px 10px',
                borderRadius: '999px',
                backgroundColor: '#FFEAEA',
                color: '#D44242',
                border: '1px solid #FF8E8E',
                letterSpacing: '0.4px',
              }}
            >
              1 CHANCE ONLY
            </span>
          </div>

          <h2 style={{ fontSize: '1.25rem', color: '#2C3E50', margin: 0, fontWeight: 800 }}>
            {phase === 'memorize'
              ? `Round ${currentRound} of ${TOTAL_ROUNDS}: Memorize (${viewTimeRemaining.toFixed(1)}s)`
              : phase === 'recall'
              ? `Round ${currentRound} of ${TOTAL_ROUNDS}: Tap the ${highlightedCells.length - selectedCells.length} crystal locations!`
              : 'Evaluating pattern...'}
          </h2>
        </div>

        <motion.div
          animate={{
            rotate: isRotating ? rotationAngle : 0,
          }}
          transition={{ duration: 0.7, type: 'spring', damping: 18 }}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gap: '8px',
            maxWidth: '320px',
            width: '100%',
            backgroundColor: '#FAF7F2',
            padding: '12px',
            borderRadius: '24px',
            border: '3px solid #EFEAE2',
          }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, idx) => {
            const isTarget = highlightedCells.includes(idx);
            const isSelected = selectedCells.includes(idx);
            const showAsHighlighted = phase === 'memorize' && isTarget;
            const showEvaluatedSuccess = phase === 'evaluating' && isTarget && isSelected;
            const showEvaluatedMiss = phase === 'evaluating' && isTarget && !isSelected;
            const showEvaluatedWrong = phase === 'evaluating' && !isTarget && isSelected;

            let bgColor = '#FFFFFF';
            let borderColor = '#E2D9CC';

            if (showAsHighlighted) {
              bgColor = '#3CA2FF';
              borderColor = '#1E74C4';
            } else if (isSelected) {
              bgColor = '#F5A623';
              borderColor = '#C97E06';
            }

            if (showEvaluatedSuccess) {
              bgColor = '#38B07D';
              borderColor = '#248259';
            } else if (showEvaluatedMiss) {
              bgColor = '#E8F8F0';
              borderColor = '#38B07D';
            } else if (showEvaluatedWrong) {
              bgColor = '#FFF0F0';
              borderColor = '#FF6565';
            }

            return (
              <motion.button
                key={idx}
                onClick={() => handleCellClick(idx)}
                disabled={phase !== 'recall'}
                whileHover={{ scale: phase === 'recall' ? 1.08 : 1 }}
                whileTap={{ scale: 0.94 }}
                animate={{
                  scale: showAsHighlighted ? 1.06 : 1,
                  backgroundColor: bgColor,
                }}
                style={{
                  aspectRatio: '1/1',
                  borderRadius: '20px',
                  border: `3px solid ${borderColor}`,
                  cursor: phase === 'recall' ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 5px 0 rgba(0,0,0,0.06)',
                  transition: 'background-color 0.2s',
                }}
              >
                {(showAsHighlighted || isSelected || showEvaluatedSuccess) && (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="#FFFFFF">
                    <polygon points="12 2 22 8.5 12 22 2 8.5" />
                  </svg>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      <GameCompletionModal
        isOpen={isCompleted}
        gameTitle="3D Memory Crystal Grid"
        totalScore={metrics.score}
        correctAnswers={correctCount}
        totalQuestions={TOTAL_ROUNDS}
        onPlayAgain={handlePlayAgain}
        onBackToMap={onBack}
      />
    </div>
  );
};
