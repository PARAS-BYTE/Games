import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { GameHeader } from '../../components/common/GameHeader';
import { ScoreTallyModal } from '../../components/common/ScoreTallyModal';
import { AdaptiveEngine } from '../../engine/AdaptiveEngine';
import type { GameMetrics } from '../../engine/types';
import { sounds } from '../../audio/soundEngine';

interface StoryCard {
  id: number;
  order: number;
  title: string;
  desc: string;
  iconSvg: React.ReactNode;
}

interface StoryTheme {
  name: string;
  cards: StoryCard[];
}

const STORIES: StoryTheme[] = [
  {
    name: 'The Butterfly Garden',
    cards: [
      {
        id: 1,
        order: 1,
        title: 'Tiny Egg',
        desc: 'Laid gently upon a green leaf in the sun',
        iconSvg: (
          <svg width="44" height="44" viewBox="0 0 100 100">
            <ellipse cx="50" cy="55" rx="24" ry="32" fill="#FFEAA7" stroke="#FDCB6E" strokeWidth="4" />
          </svg>
        ),
      },
      {
        id: 2,
        order: 2,
        title: 'Hungry Caterpillar',
        desc: 'Munching sweet leaves and growing strong',
        iconSvg: (
          <svg width="44" height="44" viewBox="0 0 100 100">
            <circle cx="30" cy="55" r="14" fill="#55EFC4" />
            <circle cx="48" cy="50" r="14" fill="#00B894" />
            <circle cx="66" cy="55" r="14" fill="#55EFC4" />
            <circle cx="70" cy="50" r="3" fill="#2D3436" />
          </svg>
        ),
      },
      {
        id: 3,
        order: 3,
        title: 'Silky Cocoon',
        desc: 'Resting quietly in a cozy hanging chrysalis',
        iconSvg: (
          <svg width="44" height="44" viewBox="0 0 100 100">
            <ellipse cx="50" cy="50" rx="18" ry="32" fill="#DFE6E9" stroke="#B2BEC3" strokeWidth="4" />
            <line x1="50" y1="18" x2="50" y2="4" stroke="#636E72" strokeWidth="4" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        id: 4,
        order: 4,
        title: 'Fluttering Butterfly',
        desc: 'Spreading vibrant wings into the clear sky',
        iconSvg: (
          <svg width="44" height="44" viewBox="0 0 100 100">
            <ellipse cx="50" cy="50" rx="6" ry="24" fill="#2D3436" />
            <path d="M44 35 Q10 20 20 50 Q30 70 44 60" fill="#FF7675" />
            <path d="M56 35 Q90 20 80 50 Q70 70 56 60" fill="#74B9FF" />
          </svg>
        ),
      },
    ],
  },
  {
    name: 'Baking Warm Bread',
    cards: [
      {
        id: 5,
        order: 1,
        title: 'Gather Flour & Water',
        desc: 'Scooping golden wheat grains into a bowl',
        iconSvg: (
          <svg width="44" height="44" viewBox="0 0 100 100">
            <ellipse cx="50" cy="65" rx="34" ry="18" fill="#FDCB6E" />
            <path d="M16 65 Q50 90 84 65" fill="#E17055" />
          </svg>
        ),
      },
      {
        id: 6,
        order: 2,
        title: 'Kneading Dough',
        desc: 'Folding and pressing with loving care',
        iconSvg: (
          <svg width="44" height="44" viewBox="0 0 100 100">
            <ellipse cx="50" cy="55" rx="30" ry="22" fill="#FFEAA7" />
            <circle cx="42" cy="52" r="4" fill="#FDCB6E" />
            <circle cx="58" cy="56" r="4" fill="#FDCB6E" />
          </svg>
        ),
      },
      {
        id: 7,
        order: 3,
        title: 'Baking in the Oven',
        desc: 'Rising golden brown in warm oven light',
        iconSvg: (
          <svg width="44" height="44" viewBox="0 0 100 100">
            <rect x="20" y="24" width="60" height="52" rx="10" fill="#636E72" />
            <rect x="28" y="32" width="44" height="36" rx="6" fill="#FAB1A0" />
          </svg>
        ),
      },
      {
        id: 8,
        order: 4,
        title: 'Sharing Fresh Slices',
        desc: 'Crispy warm bread enjoyed together',
        iconSvg: (
          <svg width="44" height="44" viewBox="0 0 100 100">
            <path d="M25 60 Q50 35 75 60 L70 75 Q50 65 30 75 Z" fill="#E17055" stroke="#D63031" strokeWidth="3" />
          </svg>
        ),
      },
    ],
  },
];

export const StorySequencer: React.FC<{
  onBack: () => void;
  initialLevel?: number;
}> = ({ onBack, initialLevel = 1 }) => {
  const [metrics, setMetrics] = useState<GameMetrics>(() =>
    AdaptiveEngine.createInitialMetrics(initialLevel)
  );

  const [currentStory, setCurrentStory] = useState<StoryTheme>(STORIES[0]);
  const [availableCards, setAvailableCards] = useState<StoryCard[]>([]);
  const [timelineCards, setTimelineCards] = useState<StoryCard[]>([]);
  const [isPlayingSlideshow, setIsPlayingSlideshow] = useState(false);
  const [previewCardIdx, setPreviewCardIdx] = useState<number | null>(null);
  const [roundStartTime, setRoundStartTime] = useState(Date.now());
  const [isTallyOpen, setIsTallyOpen] = useState(false);
  const [lastRoundResult, setLastRoundResult] = useState({
    isCorrect: false,
    score: 0,
    levelShift: 0,
    newLevel: 1,
    timeMs: 0,
  });

  const startNewRound = () => {
    setIsTallyOpen(false);
    setIsPlayingSlideshow(false);
    setPreviewCardIdx(null);
    setTimelineCards([]);
    setRoundStartTime(Date.now());

    const story = STORIES[Math.floor(Math.random() * STORIES.length)];
    setCurrentStory(story);

    const shuffled = [...story.cards].sort(() => Math.random() - 0.5);
    setAvailableCards(shuffled);
  };

  useEffect(() => {
    startNewRound();
  }, [metrics.currentLevel]);

  const handleCardTap = (card: StoryCard) => {
    if (isPlayingSlideshow) return;
    sounds.playTap();

    setAvailableCards((prev) => prev.filter((c) => c.id !== card.id));
    const nextTimeline = [...timelineCards, card];
    setTimelineCards(nextTimeline);

    if (nextTimeline.length === currentStory.cards.length) {
      const isCorrectOrder = nextTimeline.every((c, idx) => c.order === idx + 1);
      const elapsed = Date.now() - roundStartTime;

      if (isCorrectOrder) {
        sounds.playCorrect();
        setIsPlayingSlideshow(true);

        nextTimeline.forEach((_, idx) => {
          setTimeout(() => {
            setPreviewCardIdx(idx);
            sounds.playNote(523.25 + idx * 80, 0.25);
          }, idx * 450);
        });

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
        }, nextTimeline.length * 450 + 600);
      } else {
        sounds.playIncorrect();
      }
    }
  };

  const handleRemoveFromTimeline = (card: StoryCard) => {
    if (isPlayingSlideshow) return;
    sounds.playTap();
    setTimelineCards((prev) => prev.filter((c) => c.id !== card.id));
    setAvailableCards((prev) => [...prev, card]);
  };

  const handleReset = () => {
    sounds.playTap();
    setAvailableCards([...availableCards, ...timelineCards]);
    setTimelineCards([]);
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', padding: '16px' }}>
      <GameHeader
        title="Story Logic Builder"
        category="Logic"
        themeColor="#8E44AD"
        metrics={metrics}
        onBack={onBack}
      />

      <div
        className="toy-card"
        style={{
          padding: '32px 24px',
          textAlign: 'center',
          backgroundColor: '#FFFFFF',
          minHeight: '480px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem', color: '#2C3E50', marginBottom: '6px', fontWeight: 700 }}>
            {currentStory.name}
          </h2>
          <p style={{ color: '#7F8C8D', fontSize: '0.95rem', margin: 0 }}>
            Arrange the moments in the correct chronological story order!
          </p>
        </div>

        <div style={{ margin: '24px 0', width: '100%' }}>
          <div
            style={{
              display: 'flex',
              gap: '14px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            {Array.from({ length: currentStory.cards.length }).map((_, slotIdx) => {
              const card = timelineCards[slotIdx];
              const isCurrentPreview = previewCardIdx === slotIdx;

              return (
                <React.Fragment key={slotIdx}>
                  <motion.div
                    onClick={() => card && handleRemoveFromTimeline(card)}
                    animate={{
                      scale: isCurrentPreview ? 1.15 : 1,
                      borderColor: card ? '#8E44AD' : '#E0D6C8',
                    }}
                    whileHover={{ scale: card ? 1.05 : 1 }}
                    style={{
                      width: '140px',
                      minHeight: '170px',
                      backgroundColor: card ? '#FFFFFF' : '#FAF7F2',
                      border: `3px dashed ${card ? '#8E44AD' : '#D8CEBE'}`,
                      borderRadius: '20px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: card ? 'pointer' : 'default',
                      boxShadow: card ? '0 8px 18px rgba(142,68,173,0.12)' : 'none',
                    }}
                  >
                    {card ? (
                      <>
                        {card.iconSvg}
                        <h4 style={{ fontSize: '0.95rem', margin: '8px 0 4px', color: '#2C3E50' }}>
                          {card.title}
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: '#7F8C8D', lineHeight: 1.2 }}>
                          {card.desc}
                        </span>
                      </>
                    ) : (
                      <span style={{ color: '#BDC3C7', fontWeight: 700, fontSize: '1.2rem' }}>
                        Step {slotIdx + 1}
                      </span>
                    )}
                  </motion.div>

                  {slotIdx < currentStory.cards.length - 1 && (
                    <ArrowRight size={22} color="#D8CEBE" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
            {availableCards.map((card) => (
              <motion.div
                key={card.id}
                onClick={() => handleCardTap(card)}
                whileHover={{ scale: 1.06, y: -4 }}
                whileTap={{ scale: 0.95 }}
                className="toy-card-interactive"
                style={{
                  width: '140px',
                  minHeight: '160px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  padding: '12px',
                  border: '3px solid #EFEAE2',
                  boxShadow: '0 6px 12px rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {card.iconSvg}
                <h4 style={{ fontSize: '0.95rem', margin: '8px 0 4px', color: '#2C3E50' }}>
                  {card.title}
                </h4>
                <span style={{ fontSize: '0.75rem', color: '#7F8C8D', lineHeight: 1.2 }}>
                  {card.desc}
                </span>
              </motion.div>
            ))}
          </div>

          {timelineCards.length > 0 && !isPlayingSlideshow && (
            <button
              onClick={handleReset}
              className="btn-squishy btn-outline"
              style={{ padding: '6px 16px', fontSize: '0.85rem' }}
            >
              <RotateCcw size={14} />
              <span>Reset Sequence</span>
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
