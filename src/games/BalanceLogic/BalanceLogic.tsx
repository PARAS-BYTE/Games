import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameHeader } from '../../components/common/GameHeader';
import { GameCompletionModal } from '../../components/common/GameCompletionModal';
import { AdaptiveEngine } from '../../engine/AdaptiveEngine';
import type { GameMetrics } from '../../engine/types';
import { sounds } from '../../audio/soundEngine';
import { generateBalancePuzzles, type BalancePuzzle, type WeightItem } from '../../data/balancePuzzles';

export const BalanceLogic: React.FC<{
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

  const [puzzlesList, setPuzzlesList] = useState<BalancePuzzle[]>([]);
  const [currentPuzzle, setCurrentPuzzle] = useState<BalancePuzzle | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [roundStartTime, setRoundStartTime] = useState<number>(Date.now());
  const [feedbackNotice, setFeedbackNotice] = useState<{ text: string; isSuccess: boolean } | null>(null);

  useEffect(() => {
    const list = generateBalancePuzzles();
    setPuzzlesList(list);
    setupRound(1, list);
  }, []);

  const setupRound = (roundNum: number, pool?: BalancePuzzle[]) => {
    setSelectedOption(null);
    setFeedbackNotice(null);
    setRoundStartTime(Date.now());

    const activePool = pool || puzzlesList;
    if (activePool.length === 0) return;

    const tier = roundNum <= 2 ? 'Easy' : roundNum <= 5 ? 'Medium' : roundNum <= 8 ? 'Hard' : 'Expert';
    const eligible = activePool.filter((p) => p.tier === tier);
    const chosen = eligible[Math.floor(Math.random() * eligible.length)] || activePool[0];
    setCurrentPuzzle(chosen);
  };

  const renderItemPill = (item: WeightItem, count: number) => {
    return (
      <div
        key={item.id}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#FFFFFF',
          padding: '4px 12px',
          borderRadius: '999px',
          border: `2px solid ${item.color}`,
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            width: '18px',
            height: '18px',
            borderRadius: item.shape === 'sphere' ? '50%' : '4px',
            backgroundColor: item.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontSize: '11px',
            fontWeight: 900,
          }}
        >
          {item.symbol}
        </div>
        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#2C3E50' }}>
          {count > 1 ? `${count}x ` : ''}{item.name}
        </span>
      </div>
    );
  };

  const renderPhysicalScale = (
    leftItems: { item: WeightItem; count: number }[],
    rightItems: { item: WeightItem; count: number }[] | null,
    isMystery: boolean = false
  ) => {
    return (
      <div
        style={{
          backgroundColor: '#FAF7F2',
          borderRadius: '18px',
          border: '2px solid #EFEAE2',
          padding: '8px 14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        {/* Scale Balance Beam SVG */}
        <svg width="200" height="26" viewBox="0 0 200 26">
          <polygon points="100 10 92 24 108 24" fill="#7F8C8D" />
          <circle cx="100" cy="10" r="3" fill="#2C3E50" />
          <rect x="15" y="8" width="170" height="3" rx="1.5" fill="#2C3E50" />
          <line x1="25" y1="10" x2="25" y2="20" stroke="#7F8C8D" strokeWidth="1.5" />
          <line x1="10" y1="20" x2="40" y2="20" stroke="#2C3E50" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="175" y1="10" x2="175" y2="20" stroke="#7F8C8D" strokeWidth="1.5" />
          <line x1="160" y1="20" x2="190" y2="20" stroke="#2C3E50" strokeWidth="2.5" strokeLinecap="round" />
        </svg>

        {/* Item Pans Container */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '45%' }}>
            {leftItems.map((entry, idx) => (
              <React.Fragment key={idx}>{renderItemPill(entry.item, entry.count)}</React.Fragment>
            ))}
          </div>

          <div
            style={{
              fontWeight: 900,
              fontSize: '1.2rem',
              color: isMystery ? '#E74C3C' : '#38B07D',
            }}
          >
            =
          </div>

          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '45%', justifyContent: 'flex-end' }}>
            {rightItems ? (
              rightItems.map((entry, idx) => (
                <React.Fragment key={idx}>{renderItemPill(entry.item, entry.count)}</React.Fragment>
              ))
            ) : (
              <div
                style={{
                  padding: '4px 12px',
                  borderRadius: '999px',
                  backgroundColor: '#FFF0F0',
                  border: '2px dashed #E74C3C',
                  color: '#E74C3C',
                  fontWeight: 900,
                  fontSize: '1rem',
                }}
              >
                ?
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleSelectOption = (idx: number) => {
    if (!currentPuzzle || selectedOption !== null || feedbackNotice) return;
    setSelectedOption(idx);

    const isCorrect = currentPuzzle.options[idx].isCorrect;
    const elapsed = Date.now() - roundStartTime;

    if (isCorrect) {
      sounds.playCorrect();
      setCorrectCount((c) => c + 1);
      const points = currentRound >= 8 ? 160 : currentRound >= 5 ? 130 : 100;
      setFeedbackNotice({ text: `+${points} pts! Perfect Equilibrium!`, isSuccess: true });
    } else {
      sounds.playIncorrect();
      setFeedbackNotice({ text: 'Not balanced! ' + currentPuzzle.explanation, isSuccess: false });
    }

    const { nextMetrics } = AdaptiveEngine.recordRound(metrics, isCorrect, elapsed);
    setMetrics(nextMetrics);

    // Continuous flow into next question after 850ms
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
        title="Balance Scales Logic"
        category="Analytical"
        themeColor="#E74C3C"
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
            Use the balanced premise scales to solve the mystery scale:
          </p>
        </div>

        {/* Premise Scales (Known Equilibriums) */}
        <div style={{ display: 'grid', gridTemplateColumns: currentPuzzle.premiseScales.length > 1 ? '1fr 1fr' : '1fr', gap: '8px', maxWidth: '640px', margin: '0 auto 12px' }}>
          {currentPuzzle.premiseScales.map((scale, sIdx) => (
            <div key={sIdx}>
              {renderPhysicalScale(scale.left, scale.right, false)}
            </div>
          ))}
        </div>

        {/* Target Mystery Scale */}
        <div style={{ maxWidth: '420px', margin: '0 auto 14px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#E74C3C', marginBottom: '4px' }}>
            Target Equilibrium to Balance:
          </div>
          {renderPhysicalScale(
            currentPuzzle.targetScaleLeft,
            selectedOption !== null ? currentPuzzle.options[selectedOption].items : null,
            true
          )}
        </div>

        {/* Answer Choices Tray */}
        <div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#2C3E50', marginBottom: '8px' }}>
            Which combination balances the target scale?
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
              maxWidth: '640px',
              margin: '0 auto',
            }}
          >
            {currentPuzzle.options.map((opt, idx) => {
              const isChosen = selectedOption === idx;
              let borderColor = '#EAE2D5';
              let bgColor = '#FFFFFF';

              if (selectedOption !== null) {
                if (isChosen) {
                  borderColor = opt.isCorrect ? '#38B07D' : '#FF6565';
                  bgColor = opt.isCorrect ? '#E8F8F0' : '#FFF0F0';
                } else if (opt.isCorrect) {
                  borderColor = '#38B07D';
                }
              }

              return (
                <motion.button
                  key={idx}
                  whileHover={{ scale: selectedOption === null ? 1.05 : 1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={selectedOption !== null}
                  onClick={() => handleSelectOption(idx)}
                  className="btn-squishy"
                  style={{
                    backgroundColor: bgColor,
                    border: `2px solid ${borderColor}`,
                    padding: '8px 10px',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: selectedOption === null ? 'pointer' : 'default',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#A09687' }}>Option {idx + 1}</span>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {opt.items.map((entry, eIdx) => (
                      <React.Fragment key={eIdx}>{renderItemPill(entry.item, entry.count)}</React.Fragment>
                    ))}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      <GameCompletionModal
        isOpen={isCompleted}
        gameTitle="Balance Scales Logic"
        totalScore={metrics.score}
        correctAnswers={correctCount}
        totalQuestions={TOTAL_ROUNDS}
        onPlayAgain={handlePlayAgain}
        onBackToMap={onBack}
      />
    </div>
  );
};
