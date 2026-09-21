import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameHeader } from '../../components/common/GameHeader';
import { GameCompletionModal } from '../../components/common/GameCompletionModal';
import { AdaptiveEngine } from '../../engine/AdaptiveEngine';
import type { GameMetrics } from '../../engine/types';
import { sounds } from '../../audio/soundEngine';
import { EXPANDED_MOOD_SCENARIOS, type MoodScenarioItem } from '../../data/expandedPuzzles';

type EmotionKey = 'happy' | 'sad' | 'surprised' | 'nervous' | 'content' | 'curious';

export const MoodMatch: React.FC<{
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

  const [currentScenario, setCurrentScenario] = useState<MoodScenarioItem>(EXPANDED_MOOD_SCENARIOS[0]);
  const [emotionOptions, setEmotionOptions] = useState<EmotionKey[]>(['happy', 'sad', 'surprised']);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionKey | null>(null);
  const [isNodding, setIsNodding] = useState(false);
  const [roundStartTime, setRoundStartTime] = useState(Date.now());
  const [feedbackNotice, setFeedbackNotice] = useState<{ text: string; isSuccess: boolean } | null>(null);

  const renderExpression = (emotion: EmotionKey) => {
    let browLeft = 'M32 36 Q38 34 44 36';
    let browRight = 'M56 36 Q62 34 68 36';
    let mouth = 'M36 65 Q50 78 64 65';
    let eyes = (
      <>
        <circle cx="38" cy="44" r="5" fill="#2C3E50" />
        <circle cx="62" cy="44" r="5" fill="#2C3E50" />
      </>
    );

    if (emotion === 'happy') {
      browLeft = 'M32 33 Q38 30 44 34';
      browRight = 'M56 34 Q62 30 68 33';
      mouth = 'M34 62 Q50 82 66 62';
      eyes = (
        <>
          <path d="M33 46 Q38 38 43 46" stroke="#2C3E50" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M57 46 Q62 38 67 46" stroke="#2C3E50" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      );
    } else if (emotion === 'sad') {
      browLeft = 'M32 33 Q38 37 44 38';
      browRight = 'M56 38 Q62 37 68 33';
      mouth = 'M36 72 Q50 60 64 72';
    } else if (emotion === 'surprised') {
      browLeft = 'M32 28 Q38 24 44 28';
      browRight = 'M56 28 Q62 24 68 28';
      mouth = 'M42 66 A8 10 0 1 0 58 66 A8 10 0 1 0 42 66';
      eyes = (
        <>
          <circle cx="38" cy="42" r="7" fill="#2C3E50" />
          <circle cx="62" cy="42" r="7" fill="#2C3E50" />
        </>
      );
    } else if (emotion === 'nervous') {
      browLeft = 'M32 30 Q38 34 44 30';
      browRight = 'M56 30 Q62 34 68 30';
      mouth = 'M38 66 Q44 63 50 66 Q56 69 62 66';
    } else if (emotion === 'content') {
      browLeft = 'M32 34 Q38 32 44 34';
      browRight = 'M56 34 Q62 32 68 34';
      mouth = 'M38 65 Q50 72 62 65';
      eyes = (
        <>
          <path d="M34 44 Q38 40 42 44" stroke="#2C3E50" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M58 44 Q62 40 66 44" stroke="#2C3E50" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </>
      );
    } else if (emotion === 'curious') {
      browLeft = 'M32 28 Q38 24 44 28';
      browRight = 'M56 36 Q62 34 68 36';
      mouth = 'M42 66 Q50 64 56 68';
    }

    return (
      <svg width="92" height="92" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill="#FFEAA7" stroke="#FDCB6E" strokeWidth="3" />
        <circle cx="28" cy="54" r="7" fill="#FF7675" opacity="0.4" />
        <circle cx="72" cy="54" r="7" fill="#FF7675" opacity="0.4" />
        <path d={browLeft} stroke="#2C3E50" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d={browRight} stroke="#2C3E50" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        {eyes}
        <path d={mouth} stroke="#2C3E50" strokeWidth="3.5" strokeLinecap="round" fill={emotion === 'surprised' ? '#2C3E50' : 'none'} />
      </svg>
    );
  };

  const setupRound = (roundNum: number) => {
    setSelectedEmotion(null);
    setIsNodding(false);
    setFeedbackNotice(null);
    setRoundStartTime(Date.now());

    // Scale by tier: Easy (1-2), Medium (3-5), Hard (6-8), Expert (9-10)
    const tier = roundNum <= 2 ? 'Easy' : roundNum <= 5 ? 'Medium' : roundNum <= 8 ? 'Hard' : 'Expert';
    const eligibleScenarios = EXPANDED_MOOD_SCENARIOS.filter((s) => s.tier === tier);
    const chosenScenario = eligibleScenarios[Math.floor(Math.random() * eligibleScenarios.length)] || EXPANDED_MOOD_SCENARIOS[0];
    setCurrentScenario(chosenScenario);

    const allEmotions: EmotionKey[] = ['happy', 'sad', 'surprised', 'nervous', 'content', 'curious'];
    const optionsCount = roundNum >= 5 ? 4 : 3;
    const options = new Set<EmotionKey>([chosenScenario.correctEmotion]);
    while (options.size < optionsCount) {
      const rand = allEmotions[Math.floor(Math.random() * allEmotions.length)];
      options.add(rand);
    }
    setEmotionOptions(Array.from(options).sort(() => Math.random() - 0.5));
  };

  useEffect(() => {
    setupRound(1);
  }, []);

  const handleSelectAnswer = (emotion: EmotionKey) => {
    if (selectedEmotion || feedbackNotice) return;
    setSelectedEmotion(emotion);
    const isCorrect = emotion === currentScenario.correctEmotion;
    const elapsed = Date.now() - roundStartTime;

    if (isCorrect) {
      sounds.playCorrect();
      setIsNodding(true);
      setCorrectCount((c) => c + 1);
      const points = currentRound >= 8 ? 150 : currentRound >= 5 ? 120 : 100;
      setFeedbackNotice({ text: `+${points} pts! Accurate Empathy!`, isSuccess: true });
    } else {
      sounds.playIncorrect();
      setFeedbackNotice({ text: 'Answer was: ' + currentScenario.correctEmotion, isSuccess: false });
    }

    const { nextMetrics } = AdaptiveEngine.recordRound(metrics, isCorrect, elapsed);
    setMetrics(nextMetrics);

    // Continuous flow: advance smoothly to next round after 900ms
    setTimeout(() => {
      if (currentRound >= TOTAL_ROUNDS) {
        setIsCompleted(true);
      } else {
        const nextR = currentRound + 1;
        setCurrentRound(nextR);
        setupRound(nextR);
      }
    }, 900);
  };

  const handlePlayAgain = () => {
    setCurrentRound(1);
    setCorrectCount(0);
    setIsCompleted(false);
    setMetrics(AdaptiveEngine.createInitialMetrics(1));
    setupRound(1);
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '8px 16px', maxHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <GameHeader
        title="Mood Match & Empathy"
        category="Emotional"
        themeColor="#E67E22"
        metrics={{ ...metrics, totalRounds: currentRound - 1 }}
        onBack={onBack}
      />

      <div
        className="toy-card"
        style={{
          padding: '16px 20px',
          textAlign: 'center',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
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

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '2px' }}>
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
            <h2 style={{ fontSize: '1.25rem', color: '#2C3E50', margin: 0, fontWeight: 800 }}>
              Match the Feeling
            </h2>
          </div>
          <div
            style={{
              backgroundColor: '#FAF7F2',
              borderRadius: '18px',
              padding: '12px 20px',
              border: '3px solid #EFEAE2',
              maxWidth: '580px',
              margin: '8px auto',
              fontSize: '1.15rem',
              fontWeight: 800,
              color: '#2C3E50',
              lineHeight: '1.4',
            }}
          >
            "{currentScenario.situation}"
          </div>
        </div>

        {/* Emotion Face Option Cards */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '14px',
            flexWrap: 'wrap',
            margin: '10px 0',
          }}
        >
          {emotionOptions.map((emotion) => {
            const isSelected = selectedEmotion === emotion;
            const isCorrectOption = emotion === currentScenario.correctEmotion;

            return (
              <motion.div
                key={emotion}
                whileHover={{ scale: selectedEmotion ? 1 : 1.06 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  rotate: isNodding && isCorrectOption ? [-3, 3, -3, 3, 0] : 0,
                  scale: isSelected ? 1.06 : selectedEmotion ? 0.92 : 1,
                  opacity: selectedEmotion && !isSelected ? 0.45 : 1,
                }}
                transition={{ duration: 0.4 }}
                onClick={() => handleSelectAnswer(emotion)}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  padding: '10px 14px',
                  border: `3px solid ${
                    isSelected
                      ? isCorrectOption
                        ? '#38B07D'
                        : '#FF6565'
                      : '#EFEAE2'
                  }`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  cursor: selectedEmotion ? 'default' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  minWidth: '115px',
                }}
              >
                {renderExpression(emotion)}
                <span
                  style={{
                    textTransform: 'capitalize',
                    fontWeight: 800,
                    color: '#2C3E50',
                    fontSize: '1rem',
                  }}
                >
                  {emotion}
                </span>
              </motion.div>
            );
          })}
        </div>

        {selectedEmotion && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '8px 18px',
              borderRadius: '14px',
              backgroundColor: '#FEF7E6',
              border: '2px solid #F5A623',
              maxWidth: '560px',
              color: '#C97E06',
              fontSize: '0.92rem',
              fontWeight: 700,
              lineHeight: 1.35,
            }}
          >
            {currentScenario.explanation}
          </motion.div>
        )}
      </div>

      <GameCompletionModal
        isOpen={isCompleted}
        gameTitle="Mood Match & Empathy"
        totalScore={metrics.score}
        correctAnswers={correctCount}
        totalQuestions={TOTAL_ROUNDS}
        onPlayAgain={handlePlayAgain}
        onBackToMap={onBack}
      />
    </div>
  );
};
