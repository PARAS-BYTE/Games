import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, ArrowLeft } from 'lucide-react';
import { sounds } from '../../audio/soundEngine';
import { BreathingOrb3D } from '../../components/3d/BreathingOrb3D';

export const BreathingBubble: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [cycleCount, setCycleCount] = useState(0);
  const [isMuted, setIsMuted] = useState(sounds.getIsMuted());

  useEffect(() => {
    sounds.startAmbientHum();
    return () => {
      sounds.stopAmbientHum();
    };
  }, []);

  useEffect(() => {
    let timer: number;

    if (phase === 'Inhale') {
      timer = window.setTimeout(() => {
        setPhase('Hold');
      }, 4000);
    } else if (phase === 'Hold') {
      timer = window.setTimeout(() => {
        setPhase('Exhale');
      }, 2000);
    } else if (phase === 'Exhale') {
      timer = window.setTimeout(() => {
        setPhase('Inhale');
        setCycleCount((c) => c + 1);
      }, 4000);
    }

    return () => clearTimeout(timer);
  }, [phase]);

  const handleToggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div
      style={{
        maxWidth: '820px',
        margin: '0 auto',
        padding: '24px 16px',
        minHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 1,
        }}
      >
        <button
          onClick={() => {
            sounds.playTap();
            onBack();
          }}
          className="btn-squishy btn-outline"
          style={{ padding: '8px 18px' }}
        >
          <ArrowLeft size={18} />
          <span>Exit Break</span>
        </button>

        <div style={{ fontWeight: 800, color: '#38B07D', fontSize: '1.05rem', backgroundColor: '#E8F8F0', padding: '6px 16px', borderRadius: '999px' }}>
          Mindful Breaths: {cycleCount}
        </div>

        <button
          onClick={handleToggleSound}
          className="btn-squishy btn-outline"
          style={{ padding: '8px', borderRadius: '50%', minWidth: '40px', height: '40px' }}
        >
          {isMuted ? <VolumeX size={18} color="#7F8C8D" /> : <Volume2 size={18} color="#38B07D" />}
        </button>
      </div>

      {/* 3D Breathing Orb */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          margin: 'auto 0',
          zIndex: 1,
        }}
      >
        <BreathingOrb3D phase={phase} />

        {/* Dynamic Breathing Text */}
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginTop: '16px' }}
        >
          <h2
            style={{
              fontSize: '2.6rem',
              color: '#2C3E50',
              fontWeight: 800,
              letterSpacing: phase === 'Hold' ? '3px' : '1px',
              marginBottom: '8px',
            }}
          >
            {phase === 'Inhale' ? 'Breathe in...' : phase === 'Hold' ? 'Hold...' : 'Breathe out...'}
          </h2>
          <p style={{ color: '#7F8C8D', fontSize: '1.2rem', fontWeight: 600 }}>
            {phase === 'Inhale'
              ? 'Fill your lungs with calm focus'
              : phase === 'Hold'
              ? 'Feel the peaceful stillness'
              : 'Gently release all tension'}
          </p>
        </motion.div>
      </div>

      <button
        onClick={() => {
          sounds.playTap();
          onBack();
        }}
        className="btn-squishy btn-outline"
        style={{
          border: 'none',
          boxShadow: 'none',
          color: '#95A5A6',
          fontSize: '0.95rem',
          zIndex: 1,
        }}
      >
        I feel refreshed, continue playing
      </button>
    </div>
  );
};
