import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameHeader } from '../../components/common/GameHeader';
import { GameCompletionModal } from '../../components/common/GameCompletionModal';
import { AdaptiveEngine } from '../../engine/AdaptiveEngine';
import type { GameMetrics } from '../../engine/types';
import { sounds } from '../../audio/soundEngine';
import { generateMatrixPuzzles, type MatrixPuzzle, type MatrixCell } from '../../data/matrixPuzzles';

export const MatrixLogic: React.FC<{
  onBack: () => void;
  initialLevel?: number;
}> = ({ onBack, initialLevel = 1 }) => {
  const TOTAL_ROUNDS = 10;
  const [currentRound, setCurrentRound] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const [metrics, setMetrics] = useState<GameMetrics>(() =>
    AdaptiveEngine.createInitialMetrics(initialLevel)
  );

  const [allPuzzles, setAllPuzzles] = useState<MatrixPuzzle[]>([]);
  const [currentPuzzle, setCurrentPuzzle] = useState<MatrixPuzzle | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [roundStartTime, setRoundStartTime] = useState<number>(Date.now());
  const [feedbackNotice, setFeedbackNotice] = useState<{ text: string; isSuccess: boolean } | null>(null);

  useEffect(() => {
    const list = generateMatrixPuzzles();
    setAllPuzzles(list);
    setupRound(1, list);
  }, []);

  const setupRound = (roundNum: number, pool?: MatrixPuzzle[]) => {
    setSelectedOption(null);
    setFeedbackNotice(null);
    setRoundStartTime(Date.now());

    const activePool = pool || allPuzzles;
    if (activePool.length === 0) return;

    const tier = roundNum <= 2 ? 'Easy' : roundNum <= 5 ? 'Medium' : roundNum <= 8 ? 'Hard' : 'Expert';
    const eligible = activePool.filter((p) => p.tier === tier);
    const chosen = eligible[Math.floor(Math.random() * eligible.length)] || activePool[0];
    setCurrentPuzzle(chosen);
  };

  const renderCellGraphic = (cell: MatrixCell) => {
    const { shape, innerShape, color, rotation = 0, count = 1, fill = 'solid' } = cell;
    const isOutline = fill === 'outline';
    const isStriped = fill === 'striped';

    const getShapePath = (s: string) => {
      switch (s) {
        case 'circle':
          return <circle cx="50" cy="50" r="28" fill={isOutline ? 'none' : color} stroke={color} strokeWidth={isOutline ? 5 : 2} />;
        case 'square':
          return <rect x="24" y="24" width="52" height="52" rx="8" fill={isOutline ? 'none' : color} stroke={color} strokeWidth={isOutline ? 5 : 2} />;
        case 'triangle':
          return <polygon points="50 18 82 78 18 78" fill={isOutline ? 'none' : color} stroke={color} strokeWidth={isOutline ? 5 : 2} />;
        case 'diamond':
          return <polygon points="50 16 84 50 50 84 16 50" fill={isOutline ? 'none' : color} stroke={color} strokeWidth={isOutline ? 5 : 2} />;
        case 'cross':
          return (
            <path
              d="M38 18 H62 V38 H82 V62 H62 V82 H38 V62 H18 V38 H38 Z"
              fill={isOutline ? 'none' : color}
              stroke={color}
              strokeWidth={isOutline ? 4 : 2}
            />
          );
        case 'star':
          return (
            <polygon
              points="50 14 60 36 84 40 66 58 71 82 50 70 29 82 34 58 16 40 40 36"
              fill={isOutline ? 'none' : color}
              stroke={color}
              strokeWidth={isOutline ? 4 : 2}
            />
          );
        default:
          return null;
      }
    };

    return (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: 'transform 0.3s ease',
        }}
      >
        {isStriped && (
          <pattern id={`stripe-${color}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke={color} strokeWidth="3" />
          </pattern>
        )}
        <g fill={isStriped ? `url(#stripe-${color})` : undefined}>
          {getShapePath(shape)}
        </g>

        {innerShape && innerShape !== 'none' && (
          <g>
            {innerShape === 'dot' && <circle cx="50" cy="50" r="7" fill="#FFFFFF" stroke="#2C3E50" strokeWidth="2" />}
            {innerShape === 'square' && <rect x="42" y="42" width="16" height="16" fill="#FFFFFF" stroke="#2C3E50" strokeWidth="2" />}
            {innerShape === 'circle' && <circle cx="50" cy="50" r="12" fill="#FFFFFF" stroke="#2C3E50" strokeWidth="2" />}
          </g>
        )}

        {count > 1 && (
          <g>
            <circle cx="82" cy="22" r="10" fill="#2C3E50" />
            <text x="82" y="26" fill="#FFFFFF" fontSize="12" fontWeight="800" textAnchor="middle">
              {count}
            </text>
          </g>
        )}
      </svg>
    );
  };

  const handleSelectOption = (index: number) => {
    if (!currentPuzzle || selectedOption !== null || feedbackNotice) return;
    setSelectedOption(index);

    const isCorrect = index === currentPuzzle.correctOptionIndex;
    const elapsed = Date.now() - roundStartTime;

    if (isCorrect) {
      sounds.playCorrect();
      setCorrectCount((c) => c + 1);
      const points = currentRound >= 8 ? 160 : currentRound >= 5 ? 130 : 100;
      setFeedbackNotice({ text: `+${points} pts! Deduction Mastered!`, isSuccess: true });
    } else {
      sounds.playIncorrect();
      setFeedbackNotice({ text: 'Not quite! Rule: ' + currentPuzzle.ruleExplanation, isSuccess: false });
    }

    const { nextMetrics } = AdaptiveEngine.recordRound(metrics, isCorrect, elapsed);
    setMetrics(nextMetrics);

    // Continuous smooth transition after 850ms
    setTimeout(() => {
      if (currentRound >= TOTAL_ROUNDS) {
        setIsCompleted(true);
      } else {
        const nextR = currentRound + 1;
        setCurrentRound(nextR);
        setupRound(nextR);
      }
    }, 850);
  };

  const handlePlayAgain = () => {
    setCurrentRound(1);
    setCorrectCount(0);
    setIsCompleted(false);
    setMetrics(AdaptiveEngine.createInitialMetrics(1));
    setupRound(1);
  };

  if (!currentPuzzle) return null;

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '8px 16px', maxHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <GameHeader
        title="Matrix Logic IQ"
        category="Analytical"
        themeColor="#9B59B6"
        metrics={{ ...metrics, totalRounds: currentRound - 1 }}
        onBack={onBack}
      />

      <div
        className="toy-card"
        style={{
          padding: '16px 20px',
          textAlign: 'center',
          backgroundColor: '#FFFFFF',
          position: 'relative',
        }}
      >
        {/* Floating Quick Feedback Badge */}
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

        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '2px' }}>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                padding: '2px 10px',
                borderRadius: '999px',
                backgroundColor: currentPuzzle.tier === 'Easy' ? '#E8F8F0' : currentPuzzle.tier === 'Medium' ? '#FEF7E6' : '#FDEDEC',
                color: currentPuzzle.tier === 'Easy' ? '#248259' : currentPuzzle.tier === 'Medium' ? '#C97E06' : '#C0392B',
                textTransform: 'uppercase',
              }}
            >
              {currentPuzzle.tier} Tier
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
            <h2 style={{ fontSize: '1.25rem', color: '#2C3E50', margin: 0, fontWeight: 800 }}>
              {currentPuzzle.title}
            </h2>
          </div>
          <p style={{ color: '#7F8C8D', fontSize: '0.88rem', margin: 0, fontWeight: 600 }}>
            Analyze patterns across rows and columns to find the missing 9th tile:
          </p>
        </div>

        {/* 3x3 Matrix Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            maxWidth: '290px',
            margin: '0 auto 16px',
            padding: '10px',
            backgroundColor: '#FAF7F2',
            borderRadius: '20px',
            border: '3px solid #EFEAE2',
          }}
        >
          {currentPuzzle.grid.map((cell, idx) => {
            const isTargetSlot = idx === 8;
            const chosenOptionCell = selectedOption !== null ? currentPuzzle.options[selectedOption] : null;

            return (
              <div
                key={idx}
                style={{
                  aspectRatio: '1/1',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: isTargetSlot ? '2px dashed #9B59B6' : '2px solid #EAE2D5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {cell && renderCellGraphic(cell)}
                {isTargetSlot && !chosenOptionCell && (
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    style={{
                      fontSize: '1.8rem',
                      fontWeight: 900,
                      color: '#9B59B6',
                    }}
                  >
                    ?
                  </motion.div>
                )}
                {isTargetSlot && chosenOptionCell && renderCellGraphic(chosenOptionCell)}
              </div>
            );
          })}
        </div>

        {/* Candidate Options Tray */}
        <div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#2C3E50', marginBottom: '8px' }}>
            Select the matching tile:
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '10px',
              maxWidth: '560px',
              margin: '0 auto',
            }}
          >
            {currentPuzzle.options.map((opt, idx) => {
              const isChosen = selectedOption === idx;
              const isCorrectOpt = idx === currentPuzzle.correctOptionIndex;

              let borderColor = '#EAE2D5';
              let bgColor = '#FFFFFF';

              if (selectedOption !== null) {
                if (isChosen) {
                  borderColor = isCorrectOpt ? '#38B07D' : '#FF6565';
                  bgColor = isCorrectOpt ? '#E8F8F0' : '#FFF0F0';
                } else if (isCorrectOpt) {
                  borderColor = '#38B07D';
                }
              }

              return (
                <motion.button
                  key={idx}
                  whileHover={{ scale: selectedOption === null ? 1.1 : 1, y: -2 }}
                  whileTap={{ scale: 0.94 }}
                  disabled={selectedOption !== null}
                  onClick={() => handleSelectOption(idx)}
                  style={{
                    aspectRatio: '1/1',
                    borderRadius: '16px',
                    border: `2px solid ${borderColor}`,
                    backgroundColor: bgColor,
                    padding: '6px',
                    cursor: selectedOption === null ? 'pointer' : 'default',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {renderCellGraphic(opt)}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      <GameCompletionModal
        isOpen={isCompleted}
        gameTitle="Matrix Logic IQ"
        totalScore={metrics.score}
        correctAnswers={correctCount}
        totalQuestions={TOTAL_ROUNDS}
        onPlayAgain={handlePlayAgain}
        onBackToMap={onBack}
      />
    </div>
  );
};
