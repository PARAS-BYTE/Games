import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameHeader } from '../../components/common/GameHeader';
import { GameCompletionModal } from '../../components/common/GameCompletionModal';
import { AdaptiveEngine } from '../../engine/AdaptiveEngine';
import type { GameMetrics } from '../../engine/types';
import { sounds } from '../../audio/soundEngine';
import { CheckBadgeIcon, CrossBadgeIcon } from '../../components/common/Icons';
import { EXPANDED_LOGIC_RULES, type LogicRule } from '../../data/expandedPuzzles';
import { RulePedestal3D } from '../../components/3d/RulePedestal3D';

interface ShapeCard {
  id: number;
  shape: 'circle' | 'triangle' | 'square' | 'star';
  color: 'coral' | 'mint' | 'sky' | 'sun';
  colorHex: string;
  pattern: string;
  sides: number;
}

const SHAPES: Array<'circle' | 'triangle' | 'square' | 'star'> = ['circle', 'triangle', 'square', 'star'];
const SIDES_MAP = { circle: 0, triangle: 3, square: 4, star: 5 };
const COLOR_MAP: Record<string, { name: 'coral' | 'mint' | 'sky' | 'sun'; hex: string }> = {
  coral: { name: 'coral', hex: '#FF6565' },
  mint: { name: 'mint', hex: '#38B07D' },
  sky: { name: 'sky', hex: '#3CA2FF' },
  sun: { name: 'sun', hex: '#F5A623' },
};

export const RuleDetective: React.FC<{
  onBack: () => void;
  initialLevel?: number;
}> = ({ onBack, initialLevel = 1 }) => {
  const TOTAL_ROUNDS = 10;
  const [currentRound, setCurrentRound] = useState(1); // 1 to 10
  const [correctCount, setCorrectCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const [metrics, setMetrics] = useState<GameMetrics>(() =>
    AdaptiveEngine.createInitialMetrics(initialLevel)
  );

  const [cards, setCards] = useState<ShapeCard[]>([]);
  const [testedResults, setTestedResults] = useState<Record<number, boolean>>({});
  const [activeRule, setActiveRule] = useState<LogicRule>(EXPANDED_LOGIC_RULES[0]);
  const [ruleOptions, setRuleOptions] = useState<string[]>([]);
  const [testedCount, setTestedCount] = useState<number>(0);
  const [currentTestedCard, setCurrentTestedCard] = useState<ShapeCard | null>(null);
  const [lastTestAccepted, setLastTestAccepted] = useState<boolean | null>(null);
  const [roundStartTime, setRoundStartTime] = useState<number>(Date.now());
  const [feedbackNotice, setFeedbackNotice] = useState<{ text: string; isSuccess: boolean } | null>(null);

  const renderShapeIcon = (shape: string, hex: string) => {
    switch (shape) {
      case 'circle':
        return <circle cx="50" cy="50" r="34" fill={hex} />;
      case 'triangle':
        return <polygon points="50 16 84 76 16 76" fill={hex} />;
      case 'square':
        return <rect x="20" y="20" width="60" height="60" rx="12" fill={hex} />;
      case 'star':
        return (
          <polygon
            points="50 15 61 38 86 42 67 60 72 85 50 73 28 85 33 60 14 42 39 38"
            fill={hex}
          />
        );
      default:
        return null;
    }
  };

  const setupRound = (roundNum: number) => {
    setTestedResults({});
    setTestedCount(0);
    setCurrentTestedCard(null);
    setLastTestAccepted(null);
    setFeedbackNotice(null);
    setRoundStartTime(Date.now());

    const newCards: ShapeCard[] = [];
    const colors = Object.keys(COLOR_MAP) as Array<'coral' | 'mint' | 'sky' | 'sun'>;

    let id = 1;
    // Generate 8 diverse artifact specimens for thorough testing
    for (let i = 0; i < 8; i++) {
      const s = SHAPES[i % SHAPES.length];
      const c = colors[(i + Math.floor(Math.random() * colors.length)) % colors.length];
      newCards.push({
        id: id++,
        shape: s,
        color: c,
        colorHex: COLOR_MAP[c].hex,
        pattern: 'solid',
        sides: SIDES_MAP[s],
      });
    }
    setCards(newCards.sort(() => Math.random() - 0.5));

    // Choose rule by tier: Round 1-2 Easy, 3-5 Medium, 6-8 Hard, 9-10 Expert
    const tier = roundNum <= 2 ? 'Easy' : roundNum <= 5 ? 'Medium' : roundNum <= 8 ? 'Hard' : 'Expert';
    const eligibleRules = EXPANDED_LOGIC_RULES.filter((r) => r.tier === tier);
    const randomIndex = Math.floor(Math.random() * eligibleRules.length);
    const chosenRule = eligibleRules[randomIndex] || EXPANDED_LOGIC_RULES[0];
    setActiveRule(chosenRule);

    const distractorCount = roundNum >= 5 ? 3 : 2;
    const options = [chosenRule.ruleText, ...chosenRule.distractors.slice(0, distractorCount)].sort(
      () => Math.random() - 0.5
    );
    setRuleOptions(options);
  };

  useEffect(() => {
    setupRound(1);
  }, []);

  const handleTestCard = (card: ShapeCard) => {
    if (testedResults[card.id] !== undefined || !activeRule) return;

    sounds.playTap();
    const passed = activeRule.check(card);
    setTestedResults((prev) => ({ ...prev, [card.id]: passed }));
    setTestedCount((prev) => prev + 1);
    setCurrentTestedCard(card);
    setLastTestAccepted(passed);

    if (passed) {
      sounds.playNote(659.25, 0.25);
    } else {
      sounds.playNote(220, 0.22, 'triangle');
    }
  };

  // Continuous play: seamlessly transition to next question without interrupting modal
  const handleSelectRule = (chosenRuleText: string) => {
    if (!activeRule || feedbackNotice) return;
    const isCorrect = chosenRuleText === activeRule.ruleText;
    const elapsed = Date.now() - roundStartTime;

    if (isCorrect) {
      sounds.playCorrect();
      setCorrectCount((c) => c + 1);
      setFeedbackNotice({ text: '+120 pts! Correct Rule!', isSuccess: true });
    } else {
      sounds.playIncorrect();
      setFeedbackNotice({ text: 'Almost! Rule was: ' + activeRule.ruleText, isSuccess: false });
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

  const confidencePercentage = Math.min(100, Math.round((testedCount / 8) * 100));

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', padding: '16px' }}>
      <GameHeader
        title="Rule Detective 3D"
        category="Logic"
        themeColor="#9B59B6"
        metrics={{ ...metrics, totalRounds: currentRound - 1 }}
        onBack={onBack}
      />

      <div
        className="toy-card"
        style={{
          padding: '28px 24px',
          textAlign: 'center',
          backgroundColor: '#FFFFFF',
          minHeight: '480px',
          position: 'relative',
        }}
      >
        {/* Floating Quick Feedback Badge */}
        <AnimatePresence>
          {feedbackNotice && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                top: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: feedbackNotice.isSuccess ? '#E8F8F0' : '#FFF0F0',
                color: feedbackNotice.isSuccess ? '#248259' : '#D44242',
                border: `2px solid ${feedbackNotice.isSuccess ? '#38B07D' : '#FF6565'}`,
                padding: '8px 24px',
                borderRadius: '999px',
                fontWeight: 800,
                fontSize: '1.05rem',
                zIndex: 20,
                boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
              }}
            >
              {feedbackNotice.text}
            </motion.div>
          )}
        </AnimatePresence>

        <h2 style={{ fontSize: '1.65rem', color: '#2C3E50', marginBottom: '6px', fontWeight: 800 }}>
          3D Artifact Inspection Chamber
        </h2>
        <p style={{ color: '#7F8C8D', fontSize: '1.05rem', marginBottom: '16px', fontWeight: 600 }}>
          Round {currentRound} of {TOTAL_ROUNDS}: Tap artifacts to beam them onto the 3D testing platform!
        </p>

        {/* Real-Time Three.js 3D Inspection Pedestal */}
        <div style={{ backgroundColor: '#FAF7F2', borderRadius: '24px', border: '3px solid #EFEAE2', padding: '8px', marginBottom: '20px' }}>
          <RulePedestal3D
            currentShape={currentTestedCard ? currentTestedCard.shape : 'star'}
            currentColor={currentTestedCard ? currentTestedCard.color : 'sun'}
            isAccepted={lastTestAccepted}
          />
          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: lastTestAccepted === true ? '#248259' : lastTestAccepted === false ? '#D44242' : '#7F8C8D' }}>
            {lastTestAccepted === true
              ? '✨ ACCEPTED by the secret law! (Green Light)'
              : lastTestAccepted === false
              ? '❌ REJECTED by the secret law! (Red Light)'
              : 'Tap an artifact below to test on pedestal...'}
          </div>
        </div>

        {/* Liquid Confidence Meter */}
        <div style={{ maxWidth: '380px', margin: '0 auto 24px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.92rem',
              fontWeight: 800,
              color: '#9B59B6',
              marginBottom: '6px',
            }}
          >
            <span>Clues Gathered</span>
            <span>{confidencePercentage}%</span>
          </div>
          <div
            style={{
              height: '14px',
              backgroundColor: '#F4EEF7',
              borderRadius: '999px',
              overflow: 'hidden',
              border: '2px solid #E6D8EB',
            }}
          >
            <motion.div
              animate={{ width: `${confidencePercentage}%` }}
              transition={{ type: 'spring', damping: 15 }}
              style={{
                height: '100%',
                backgroundColor: '#9B59B6',
                borderRadius: '999px',
              }}
            />
          </div>
        </div>

        {/* Floating Cards Tray */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
            gap: '14px',
            marginBottom: '32px',
          }}
        >
          {cards.map((card) => {
            const hasTested = testedResults[card.id] !== undefined;
            const isMatch = testedResults[card.id] === true;

            return (
              <motion.div
                key={card.id}
                whileHover={{ scale: 1.08, y: -6 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => handleTestCard(card)}
                style={{
                  height: '115px',
                  backgroundColor: '#FAF7F2',
                  borderRadius: '24px',
                  border: `3px solid ${
                    hasTested ? (isMatch ? '#38B07D' : '#FF6565') : '#EAE2D5'
                  }`,
                  cursor: hasTested ? 'default' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  boxShadow: '0 6px 0 rgba(0,0,0,0.06)',
                }}
              >
                <svg width="64" height="64" viewBox="0 0 100 100">
                  {renderShapeIcon(card.shape, card.colorHex)}
                </svg>

                {hasTested && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                    }}
                  >
                    {isMatch ? <CheckBadgeIcon size={24} /> : <CrossBadgeIcon size={24} />}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Mystery Rule Hypotheses */}
        <div>
          <h4 style={{ fontSize: '1.25rem', color: '#2C3E50', marginBottom: '14px', fontWeight: 800 }}>
            Which rule fits all tested artifacts?
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '540px', margin: '0 auto' }}>
            {ruleOptions.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectRule(option)}
                className="btn-squishy btn-outline"
                style={{
                  padding: '14px 24px',
                  textAlign: 'left',
                  justifyContent: 'flex-start',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  borderRadius: '20px',
                  lineHeight: '1.4',
                }}
              >
                <span>{option}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* End of 10 questions completion modal */}
      <GameCompletionModal
        isOpen={isCompleted}
        gameTitle="Rule Detective 3D"
        totalScore={metrics.score}
        correctAnswers={correctCount}
        totalQuestions={TOTAL_ROUNDS}
        onPlayAgain={handlePlayAgain}
        onBackToMap={onBack}
      />
    </div>
  );
};
