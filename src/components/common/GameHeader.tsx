import React, { useState } from 'react';
import { Volume2, VolumeX, ArrowLeft, Zap } from 'lucide-react';
import { sounds } from '../../audio/soundEngine';
import type { GameMetrics } from '../../engine/types';
import { StarIcon } from './Icons';
import { MascotAvatar, type MascotId } from './Characters';

interface GameHeaderProps {
  title: string;
  category: string;
  themeColor: string;
  metrics: GameMetrics;
  mascotId?: MascotId;
  onBack: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  title,
  category,
  themeColor,
  metrics,
  mascotId = 'pippin',
  onBack,
}) => {
  const [isMuted, setIsMuted] = useState(sounds.getIsMuted());

  const handleToggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
    if (!muted) sounds.playTap();
  };

  const currentQuestionNumber = (metrics.totalRounds % 10) + 1;

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 18px',
        backgroundColor: '#FFFFFF',
        borderRadius: '22px',
        border: '3px solid #F0EAE1',
        boxShadow: '0 6px 16px rgba(44, 62, 80, 0.04)',
        marginBottom: '12px',
        flexWrap: 'wrap',
        gap: '14px',
      }}
    >
      {/* Left: Back button & Mascot + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          onClick={() => {
            sounds.playTap();
            onBack();
          }}
          className="btn-squishy btn-outline"
          style={{ padding: '8px 18px', fontSize: '1rem' }}
          title="Back to Game Map"
        >
          <ArrowLeft size={20} />
          <span>Map</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <MascotAvatar id={mascotId} size={48} mood={metrics.streak > 2 ? 'cheering' : 'happy'} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.55rem', color: '#2C3E50', margin: 0, fontWeight: 800 }}>
                {title}
              </h1>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  padding: '4px 12px',
                  borderRadius: '999px',
                  backgroundColor: `${themeColor}20`,
                  color: themeColor,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {category}
              </span>
            </div>
            {/* Structured 10-question run indicator */}
            <div style={{ fontSize: '0.85rem', color: '#7F8C8D', fontWeight: 800, marginTop: '2px' }}>
              Question {currentQuestionNumber} of 10 in this session
            </div>
          </div>
        </div>
      </div>

      {/* Middle: Level & Tier badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#FAF7F2',
            padding: '8px 18px',
            borderRadius: '999px',
            border: '2px solid #EAE2D5',
            fontWeight: 800,
            fontSize: '1rem',
            color: '#2C3E50',
          }}
        >
          <span>Level {metrics.currentLevel}</span>
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 800,
              padding: '2px 10px',
              borderRadius: '999px',
              backgroundColor:
                metrics.tier === 'Easy'
                  ? '#E8F8F0'
                  : metrics.tier === 'Medium'
                  ? '#FEF7E6'
                  : metrics.tier === 'Hard'
                  ? '#FFF0F0'
                  : '#F7EEFA',
              color:
                metrics.tier === 'Easy'
                  ? '#248259'
                  : metrics.tier === 'Medium'
                  ? '#C97E06'
                  : metrics.tier === 'Hard'
                  ? '#D44242'
                  : '#74348E',
            }}
          >
            {metrics.tier}
          </span>
        </div>

        {metrics.streak > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#FEF7E6',
              padding: '8px 16px',
              borderRadius: '999px',
              border: '2px solid #F5A623',
              color: '#C97E06',
              fontWeight: 800,
              fontSize: '0.95rem',
            }}
          >
            <Zap size={18} fill="#F5A623" color="#C97E06" />
            <span>{metrics.streak}x Streak!</span>
          </div>
        )}
      </div>

      {/* Right: Score & Sound & Relax Break */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 18px',
            borderRadius: '999px',
            backgroundColor: '#FEF7E6',
            color: '#C97E06',
            fontWeight: 800,
            fontSize: '1.05rem',
          }}
        >
          <StarIcon size={20} />
          <span>{metrics.score}</span>
        </div>

        <button
          onClick={handleToggleSound}
          className="btn-squishy btn-outline"
          style={{ padding: '8px', borderRadius: '50%', minWidth: '42px', height: '42px' }}
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {isMuted ? <VolumeX size={18} color="#7F8C8D" /> : <Volume2 size={18} color="#38B07D" />}
        </button>
      </div>
    </header>
  );
};
