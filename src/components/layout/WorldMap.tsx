import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, Sparkles, Compass } from 'lucide-react';
import { GAMES_CATALOG } from '../../data/gamesList';
import { StarIcon } from '../common/Icons';
import { GameSpinnerModal } from '../features/GameSpinnerModal';
import { sounds } from '../../audio/soundEngine';

interface WorldMapProps {
  onSelectGame: (gameId: string) => void;
  gameStats: Record<string, { highLevel: number; stars: number; bestScore: number }>;
}

export const WorldMap: React.FC<WorldMapProps> = ({ onSelectGame, gameStats }) => {
  const [isSpinnerOpen, setIsSpinnerOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState(sounds.getIsMuted());

  const totalStars = Object.values(gameStats).reduce((acc, curr) => acc + curr.stars, 0);

  const handleToggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
    if (!muted) sounds.playTap();
  };

  return (
    <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '24px 20px 80px', position: 'relative' }}>
      <GameSpinnerModal
        isOpen={isSpinnerOpen}
        onClose={() => setIsSpinnerOpen(false)}
        onSelectGame={(gameId) => {
          setIsSpinnerOpen(false);
          onSelectGame(gameId);
        }}
      />

      {/* Header Navigation Bar */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '22px',
              background: 'linear-gradient(135deg, #1ABC9C 0%, #2C3E50 100%)',
              border: '3px solid #F1C40F',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 24px rgba(26, 188, 156, 0.35)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '1px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              GFS
            </span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '2.3rem', color: '#2C3E50', fontWeight: 900, margin: 0, letterSpacing: '-0.8px', lineHeight: 1.1 }}>
                GFS
              </h1>
              <span
                style={{
                  background: 'linear-gradient(90deg, #E8F8F0 0%, #FEF9E7 100%)',
                  border: '1.5px solid #38B07D',
                  color: '#1E6B47',
                  padding: '4px 14px',
                  borderRadius: '999px',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  letterSpacing: '0.4px',
                }}
              >
                Geeta Finishing School
              </span>
            </div>
            <p style={{ color: '#667C89', fontSize: '1.02rem', margin: '4px 0 0', fontWeight: 700 }}>
              Analytical &amp; Cognitive Reasoning Gym &bull; 10-Question Training Modules
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              sounds.playTap();
              setIsSpinnerOpen(true);
            }}
            className="btn-squishy btn-sun"
            style={{ padding: '12px 22px', fontSize: '1.05rem' }}
          >
            <Sparkles size={22} />
            <span>Spin Lucky Wheel!</span>
          </motion.button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#FEF7E6',
              border: '2px solid #F5A623',
              padding: '10px 20px',
              borderRadius: '999px',
              fontWeight: 800,
              color: '#C97E06',
              fontSize: '1.1rem',
            }}
          >
            <StarIcon size={24} />
            <span>{totalStars} Stars</span>
          </div>

          <button
            onClick={handleToggleSound}
            className="btn-squishy btn-outline"
            style={{ padding: '10px', borderRadius: '50%', minWidth: '46px', height: '46px' }}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX size={20} color="#7F8C8D" /> : <Volume2 size={20} color="#38B07D" />}
          </button>
        </div>
      </header>

      {/* 5 Premier Game Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '28px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {GAMES_CATALOG.map((game, index) => {
          const stats = gameStats[game.id] || { highLevel: 1, stars: 0, bestScore: 0 };
          return (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              whileHover={{ y: -8, transition: { duration: 0.18 } }}
              className="toy-card toy-card-interactive"
              style={{
                padding: '30px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                cursor: 'pointer',
                borderRadius: '32px',
                backgroundColor: '#FFFFFF',
              }}
              onClick={() => {
                sounds.playTap();
                onSelectGame(game.id);
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      padding: '5px 14px',
                      borderRadius: '999px',
                      backgroundColor: `${game.color}20`,
                      color: game.color,
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px',
                    }}
                  >
                    {game.category}
                  </span>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      color: '#7F8C8D',
                    }}
                  >
                    <span>Lvl {stats.highLevel}</span>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3].map((s) => (
                        <StarIcon
                          key={s}
                          size={18}
                          fill={s <= stats.stars ? '#F5A623' : '#E5DDCF'}
                          color="#F5A623"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <h3
                  style={{
                    fontSize: '1.65rem',
                    color: '#2C3E50',
                    marginBottom: '8px',
                    fontWeight: 800,
                    letterSpacing: '-0.3px',
                  }}
                >
                  {game.title}
                </h3>
                <p
                  style={{
                    color: '#7F8C8D',
                    fontSize: '1.02rem',
                    lineHeight: '1.5',
                    marginBottom: '24px',
                    fontWeight: 600,
                  }}
                >
                  {game.description}
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '18px',
                  borderTop: '2px dashed #F0EAE1',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7F8C8D', fontSize: '0.95rem', fontWeight: 700 }}>
                  <Compass size={18} color={game.color} />
                  <span>Best: {stats.bestScore} pts</span>
                </div>

                <button
                  className="btn-squishy"
                  style={{
                    backgroundColor: game.color,
                    color: '#FFFFFF',
                    padding: '12px 28px',
                    fontSize: '1.1rem',
                    boxShadow: `0 4px 0 ${game.color}B0`,
                  }}
                >
                  Play Game
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
