import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../../audio/soundEngine';
import { StarIcon } from './Icons';
import { MascotAvatar } from './Characters';

interface GameCompletionModalProps {
  isOpen: boolean;
  gameTitle: string;
  totalScore: number;
  correctAnswers: number;
  totalQuestions?: number;
  onPlayAgain: () => void;
  onBackToMap: () => void;
}

export const GameCompletionModal: React.FC<GameCompletionModalProps> = ({
  isOpen,
  gameTitle,
  totalScore,
  correctAnswers,
  totalQuestions = 10,
  onPlayAgain,
  onBackToMap,
}) => {
  useEffect(() => {
    if (isOpen) {
      sounds.playVictory();
      confetti({
        particleCount: 85,
        spread: 75,
        origin: { y: 0.55 },
        colors: ['#38B07D', '#F5A623', '#3CA2FF', '#FF6565', '#9B59B6'],
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const starCount = correctAnswers >= 8 ? 3 : correctAnswers >= 5 ? 2 : 1;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(44, 62, 80, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 160,
          padding: '20px',
        }}
      >
        <motion.div
          initial={{ scale: 0.75, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.75, opacity: 0 }}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '36px',
            padding: '36px 32px',
            maxWidth: '480px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 24px 48px rgba(0,0,0,0.2), 0 8px 0 #E2D9CC',
            border: '4px solid #F5EFEB',
          }}
        >
          {/* Animated Cheering Mascot */}
          <MascotAvatar id="pippin" size={90} mood="cheering" />

          <h2 style={{ fontSize: '2.1rem', color: '#248259', margin: '14px 0 6px', fontWeight: 800 }}>
            {correctAnswers >= 8 ? 'Mastery Achieved!' : correctAnswers >= 5 ? 'Splendid Effort!' : 'Session Complete!'}
          </h2>
          <p style={{ color: '#7F8C8D', fontSize: '1.05rem', margin: '0 0 20px', fontWeight: 600 }}>
            Completed all {totalQuestions} rounds of {gameTitle}!
          </p>

          {/* Stars */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
            {[1, 2, 3].map((s) => (
              <motion.div
                key={s}
                initial={{ scale: 0, rotate: -25 }}
                animate={{ scale: s <= starCount ? 1.1 : 0.75, rotate: 0 }}
                transition={{ delay: s * 0.15, type: 'spring' }}
              >
                <StarIcon size={46} fill={s <= starCount ? '#F5A623' : '#E5DDCF'} color="#F5A623" />
              </motion.div>
            ))}
          </div>

          {/* Performance Stats Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '14px',
              marginBottom: '28px',
            }}
          >
            <div
              style={{
                backgroundColor: '#FAF7F2',
                padding: '16px',
                borderRadius: '20px',
                border: '2px solid #EFEAE2',
              }}
            >
              <div style={{ fontSize: '0.85rem', color: '#7F8C8D', fontWeight: 700 }}>Total Score</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#F5A623' }}>
                {totalScore} pts
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#FAF7F2',
                padding: '16px',
                borderRadius: '20px',
                border: '2px solid #EFEAE2',
              }}
            >
              <div style={{ fontSize: '0.85rem', color: '#7F8C8D', fontWeight: 700 }}>Accuracy</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#38B07D' }}>
                {correctAnswers} / {totalQuestions}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => {
                sounds.playTap();
                onPlayAgain();
              }}
              className="btn-squishy btn-mint"
              style={{ width: '100%', fontSize: '1.15rem', padding: '14px' }}
            >
              <RotateCcw size={20} />
              <span>Play Another 10 Rounds</span>
            </button>
            <button
              onClick={() => {
                sounds.playTap();
                onBackToMap();
              }}
              className="btn-squishy btn-outline"
              style={{ width: '100%', fontSize: '1.05rem', padding: '12px' }}
            >
              <ArrowLeft size={18} />
              <span>Back to Map</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
