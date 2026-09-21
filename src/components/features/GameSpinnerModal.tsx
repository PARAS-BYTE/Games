import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../../audio/soundEngine';
import { GAMES_CATALOG } from '../../data/gamesList';
import type { GameInfo } from '../../engine/types';

interface GameSpinnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGame: (gameId: string) => void;
}

const WHEEL_GAMES = GAMES_CATALOG.filter((g) => g.id !== 'breathing-bubble');

export const GameSpinnerModal: React.FC<GameSpinnerModalProps> = ({
  isOpen,
  onClose,
  onSelectGame,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [selectedGame, setSelectedGame] = useState<GameInfo | null>(null);

  const numSlices = WHEEL_GAMES.length;
  const sliceAngle = 360 / numSlices;

  const handleSpin = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setSelectedGame(null);
    sounds.playTap();

    // Random target slice
    const winningIndex = Math.floor(Math.random() * numSlices);
    // Add 5-8 full rotations for exciting spin suspense
    const extraRotations = (5 + Math.floor(Math.random() * 3)) * 360;
    // Align wheel so winning slice stops right under top pointer (270 deg or pointer at top)
    const targetAngle = extraRotations + (360 - (winningIndex * sliceAngle + sliceAngle / 2));
    const newTotalRotation = rotationDegrees + targetAngle;
    setRotationDegrees(newTotalRotation);

    // Audio clicks during spin
    let tickCount = 0;
    const tickInterval = setInterval(() => {
      sounds.playNote(700 + Math.random() * 200, 0.04);
      tickCount++;
      if (tickCount > 28) clearInterval(tickInterval);
    }, 120);

    setTimeout(() => {
      clearInterval(tickInterval);
      setIsSpinning(false);
      const chosen = WHEEL_GAMES[winningIndex];
      setSelectedGame(chosen);
      sounds.playVictory();
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
      });
    }, 3800);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(44, 62, 80, 0.55)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 120,
          padding: '20px',
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 30 }}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '36px',
            padding: '32px 28px',
            maxWidth: '480px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 25px 50px rgba(0,0,0,0.2), 0 8px 0 #E2D9CC',
            border: '4px solid #F5EFEB',
            position: 'relative',
          }}
        >
          {/* Close button */}
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: '#F0EAE1',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={20} color="#7F8C8D" />
          </button>

          <h2 style={{ fontSize: '1.8rem', color: '#2C3E50', marginBottom: '4px', fontWeight: 800 }}>
            Lucky Brain Wheel
          </h2>
          <p style={{ color: '#7F8C8D', fontSize: '0.98rem', marginBottom: '20px' }}>
            Spin the wheel to embark on a mystery cognitive adventure!
          </p>

          {/* Wheel Container with Pointer */}
          <div style={{ position: 'relative', width: '280px', height: '280px', margin: '0 auto 24px' }}>
            {/* Top Pointer Needle */}
            <div
              style={{
                position: 'absolute',
                top: '-14px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))',
              }}
            >
              <svg width="34" height="34" viewBox="0 0 30 30">
                <polygon points="15 30 2 6 28 6" fill="#FF6565" stroke="#D44242" strokeWidth="2.5" />
                <circle cx="15" cy="8" r="4" fill="#FFFFFF" />
              </svg>
            </div>

            {/* Rotating Wheel SVG */}
            <motion.div
              animate={{ rotate: rotationDegrees }}
              transition={{
                duration: 3.8,
                ease: [0.25, 0.1, 0.25, 1], // Realistic deceleration curve
              }}
              style={{ width: '100%', height: '100%', borderRadius: '50%', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
            >
              <svg viewBox="0 0 300 300" width="100%" height="100%">
                <circle cx="150" cy="150" r="146" fill="#FAF7F2" stroke="#E2D9CC" strokeWidth="6" />

                {WHEEL_GAMES.map((game, i) => {
                  const angleStart = i * sliceAngle;
                  const angleEnd = (i + 1) * sliceAngle;

                  // Compute SVG slice path
                  const radStart = (angleStart * Math.PI) / 180;
                  const radEnd = (angleEnd * Math.PI) / 180;
                  const x1 = 150 + 140 * Math.cos(radStart);
                  const y1 = 150 + 140 * Math.sin(radStart);
                  const x2 = 150 + 140 * Math.cos(radEnd);
                  const y2 = 150 + 140 * Math.sin(radEnd);

                  const pathData = `M 150 150 L ${x1} ${y1} A 140 140 0 0 1 ${x2} ${y2} Z`;
                  const textAngle = angleStart + sliceAngle / 2;

                  return (
                    <g key={game.id}>
                      <path d={pathData} fill={game.color} stroke="#FFFFFF" strokeWidth="2" />
                      {/* Short label on wheel slice */}
                      <g transform={`rotate(${textAngle} 150 150)`}>
                        <text
                          x="220"
                          y="155"
                          fill="#FFFFFF"
                          fontSize="11"
                          fontWeight="bold"
                          textAnchor="middle"
                          transform={`rotate(90 220 155)`}
                        >
                          {game.title.split(' ')[0]}
                        </text>
                      </g>
                    </g>
                  );
                })}

                {/* Center Hub */}
                <circle cx="150" cy="150" r="28" fill="#FFFFFF" stroke="#E2D9CC" strokeWidth="4" />
                <circle cx="150" cy="150" r="16" fill="#F5A623" />
              </svg>
            </motion.div>
          </div>

          {/* Action / Result */}
          {selectedGame ? (
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                backgroundColor: '#FAF7F2',
                borderRadius: '24px',
                padding: '16px',
                border: `3px solid ${selectedGame.color}`,
                marginBottom: '16px',
              }}
            >
              <div style={{ fontSize: '0.85rem', color: selectedGame.color, fontWeight: 800 }}>
                Landed on:
              </div>
              <h3 style={{ fontSize: '1.4rem', color: '#2C3E50', margin: '4px 0 8px' }}>
                {selectedGame.title}
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#7F8C8D', margin: '0 0 14px' }}>
                {selectedGame.tagline}
              </p>
              <button
                onClick={() => {
                  sounds.playTap();
                  onSelectGame(selectedGame.id);
                }}
                className="btn-squishy"
                style={{
                  backgroundColor: selectedGame.color,
                  color: '#FFFFFF',
                  width: '100%',
                  padding: '12px',
                  boxShadow: `0 4px 0 ${selectedGame.color}AA`,
                }}
              >
                Play Now!
              </button>
            </motion.div>
          ) : (
            <button
              onClick={handleSpin}
              disabled={isSpinning}
              className="btn-squishy btn-sun"
              style={{
                width: '100%',
                fontSize: '1.25rem',
                padding: '16px',
                cursor: isSpinning ? 'default' : 'pointer',
                opacity: isSpinning ? 0.75 : 1,
              }}
            >
              <Sparkles size={22} />
              <span>{isSpinning ? 'Spinning Adventure...' : 'Spin the Wheel!'}</span>
            </button>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
