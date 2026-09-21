import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { StarIcon, SparkleIcon } from './Icons';
import { sounds } from '../../audio/soundEngine';

interface ScoreTallyModalProps {
  isOpen: boolean;
  isCorrect: boolean;
  roundScore: number;
  levelShift: number;
  newLevel: number;
  accuracy: number;
  responseTimeMs: number;
  onNextRound: () => void;
  onExitToMap: () => void;
}

export const ScoreTallyModal: React.FC<ScoreTallyModalProps> = ({
  isOpen,
  isCorrect,
  roundScore,
  levelShift,
  newLevel,
  accuracy,
  responseTimeMs,
  onNextRound,
  onExitToMap,
}) => {
  useEffect(() => {
    if (isOpen) {
      if (isCorrect) {
        sounds.playVictory();
        confetti({
          particleCount: 55,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#4EBA88', '#F5A623', '#3CA2FF', '#FF6565', '#9B59B6'],
        });
      }
    }
  }, [isOpen, isCorrect]);

  if (!isOpen) return null;

  const starsCount = isCorrect ? (responseTimeMs < 2000 ? 3 : responseTimeMs < 3500 ? 2 : 1) : 1;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(44, 62, 80, 0.45)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px',
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '32px',
            padding: '36px 32px',
            maxWidth: '440px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15), 0 6px 0 #E2D9CC',
            border: '4px solid #F5EFEB',
          }}
        >
          <h2
            style={{
              fontSize: '1.8rem',
              color: isCorrect ? '#248259' : '#C97E06',
              marginBottom: '6px',
            }}
          >
            {isCorrect ? 'Well Done!' : 'Nice Effort!'}
          </h2>
          <p style={{ color: '#7F8C8D', fontSize: '1rem', marginBottom: '20px' }}>
            {isCorrect
              ? 'Great focus and accuracy!'
              : 'Keep your rhythm, brain growth happens in every attempt.'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '24px' }}>
            {[1, 2, 3].map((starIndex) => (
              <motion.div
                key={starIndex}
                initial={{ scale: 0, rotate: -20 }}
                animate={{
                  scale: starIndex <= starsCount ? 1 : 0.7,
                  rotate: 0,
                  opacity: starIndex <= starsCount ? 1 : 0.35,
                }}
                transition={{ delay: starIndex * 0.12, type: 'spring' }}
              >
                <StarIcon
                  size={44}
                  color="#F5A623"
                  fill={starIndex <= starsCount ? '#F5A623' : '#EAE2D5'}
                />
              </motion.div>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '10px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                backgroundColor: '#FAF7F2',
                padding: '12px 6px',
                borderRadius: '16px',
                border: '2px solid #EFEAE2',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#7F8C8D', fontWeight: 600 }}>Score</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#F5A623' }}>
                +{roundScore}
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#FAF7F2',
                padding: '12px 6px',
                borderRadius: '16px',
                border: '2px solid #EFEAE2',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#7F8C8D', fontWeight: 600 }}>Time</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#3CA2FF' }}>
                {(responseTimeMs / 1000).toFixed(1)}s
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#FAF7F2',
                padding: '12px 6px',
                borderRadius: '16px',
                border: '2px solid #EFEAE2',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#7F8C8D', fontWeight: 600 }}>Accuracy</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#38B07D' }}>
                {accuracy}%
              </div>
            </div>
          </div>

          {levelShift !== 0 && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '999px',
                backgroundColor: levelShift > 0 ? '#E8F8F0' : '#FEF7E6',
                color: levelShift > 0 ? '#248259' : '#C97E06',
                fontWeight: 700,
                fontSize: '0.9rem',
                marginBottom: '24px',
              }}
            >
              <SparkleIcon size={18} color={levelShift > 0 ? '#38B07D' : '#F5A623'} />
              <span>
                {levelShift > 0
                  ? `Level Up! Advancing to Level ${newLevel}`
                  : `Difficulty Adapted: Calibrated to Level ${newLevel}`}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => {
                sounds.playTap();
                onNextRound();
              }}
              className="btn-squishy btn-mint"
              style={{ width: '100%', fontSize: '1.15rem', padding: '14px' }}
            >
              Next Round
            </button>
            <button
              onClick={() => {
                sounds.playTap();
                onExitToMap();
              }}
              className="btn-squishy btn-outline"
              style={{ width: '100%', fontSize: '1rem', padding: '12px' }}
            >
              Back to Map
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
