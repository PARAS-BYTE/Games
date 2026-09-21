import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Eye, EyeOff, RotateCcw, ArrowLeft } from 'lucide-react';
import { sounds } from '../../audio/soundEngine';

export const ChronoPulse: React.FC<{
  onBack: () => void;
}> = ({ onBack }) => {
  // Random target generator (whole, half, and fractional seconds with milliseconds)
  const getRandomTarget = () => {
    const targets = [
      5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0,
      6.5, 7.5, 8.5, 9.5, 10.5, 11.5,
      7.25, 8.4, 9.75, 10.25, 11.8, 12.5,
    ];
    return targets[Math.floor(Math.random() * targets.length)];
  };

  const [targetSeconds, setTargetSeconds] = useState<number>(getRandomTarget);
  const [timerState, setTimerState] = useState<'idle' | 'running' | 'revealed'>('idle');
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [isBlind, setIsBlind] = useState<boolean>(false);
  const [differenceMs, setDifferenceMs] = useState<number | null>(null);
  const [rating, setRating] = useState<{ title: string; color: string; bg: string; pts: number } | null>(null);

  const startTimestampRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  const handleResetNewTarget = () => {
    sounds.playTap();
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setTimerState('idle');
    setElapsedMs(0);
    setIsBlind(false);
    setDifferenceMs(null);
    setRating(null);
    setTargetSeconds(getRandomTarget());
  };

  // High precision timer loop
  const updateTimer = () => {
    const now = performance.now();
    const elapsed = now - startTimestampRef.current;
    setElapsedMs(elapsed);

    // Fade into blind mode after 2.0 seconds
    if (elapsed >= 2000 && !isBlind) {
      setIsBlind(true);
    }

    animFrameRef.current = requestAnimationFrame(updateTimer);
  };

  const handleStartTimer = () => {
    if (timerState !== 'idle') return;
    sounds.playTap();
    setTimerState('running');
    setIsBlind(false);
    setElapsedMs(0);
    setDifferenceMs(null);
    setRating(null);
    startTimestampRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(updateTimer);
  };

  const handleStopTimer = () => {
    if (timerState !== 'running') return;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const stopTime = performance.now();
    const totalElapsed = stopTime - startTimestampRef.current;
    setElapsedMs(totalElapsed);
    setTimerState('revealed');
    setIsBlind(false);

    const targetMs = targetSeconds * 1000;
    const diff = totalElapsed - targetMs;
    const absDiff = Math.abs(diff);
    setDifferenceMs(diff);

    // Precision calculation
    if (absDiff <= 250) {
      sounds.playCorrect();
      setRating({ title: 'Chrono Master! (Flawless Internal Clock)', color: '#FFFFFF', bg: '#27AE60', pts: 200 });
    } else if (absDiff <= 600) {
      sounds.playCorrect();
      setRating({ title: 'Great Chrono Sense! (Very Sharp)', color: '#FFFFFF', bg: '#2980B9', pts: 150 });
    } else if (absDiff <= 1200) {
      sounds.playNote(523.25, 0.25);
      setRating({ title: 'Close Perception! (Within a Second)', color: '#FFFFFF', bg: '#F39C12', pts: 90 });
    } else {
      sounds.playIncorrect();
      setRating({ title: 'Off Target! Try Calibrating Again', color: '#FFFFFF', bg: '#C0392B', pts: 40 });
    }
  };

  // Keyboard shortcut: Spacebar starts / stops timer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (timerState === 'idle') {
          handleStartTimer();
        } else if (timerState === 'running') {
          handleStopTimer();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timerState]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const formatSecondsWithMs = (ms: number) => {
    const totalSec = ms / 1000;
    return totalSec.toFixed(2);
  };

  return (
    <div style={{ maxWidth: '1060px', width: '100%', margin: '0 auto', padding: '10px 20px', maxHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      {/* Top Bar Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          backgroundColor: '#FFFFFF',
          borderRadius: '22px',
          border: '3px solid #F0EAE1',
          boxShadow: '0 6px 16px rgba(44, 62, 80, 0.04)',
          marginBottom: '12px',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
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

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.6rem', color: '#2C3E50', margin: 0, fontWeight: 900 }}>
                Chrono Pulse: Blind Stop
              </h1>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  padding: '4px 12px',
                  borderRadius: '999px',
                  backgroundColor: '#9B59B620',
                  color: '#9B59B6',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Precision
              </span>
            </div>
            <div style={{ fontSize: '0.88rem', color: '#7F8C8D', fontWeight: 800, marginTop: '2px' }}>
              Single-Trial Internal Chronometer &bull; Millisecond Accuracy
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              fontSize: '0.82rem',
              fontWeight: 800,
              padding: '4px 14px',
              borderRadius: '999px',
              backgroundColor: '#FFEAEA',
              color: '#D44242',
              border: '1.5px solid #FF8E8E',
              letterSpacing: '0.4px',
            }}
          >
            1 CHANCE TRIAL
          </span>
        </div>
      </header>

      {/* Main Expansive Game Card */}
      <div
        className="toy-card"
        style={{
          padding: '20px 28px',
          textAlign: 'center',
          backgroundColor: '#FFFFFF',
          position: 'relative',
        }}
      >
        {/* Target Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #FAF7F2 0%, #FEF9E7 100%)',
            border: '3px solid #F5A623',
            borderRadius: '22px',
            padding: '14px 32px',
            maxWidth: '780px',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#A6720A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Target Time (Stop Here!)
            </div>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: '#C97E06', letterSpacing: '-0.8px', lineHeight: 1.1 }}>
              {targetSeconds.toFixed(2)}s
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#667C89', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Chronometer Mode
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.3rem', fontWeight: 900, color: isBlind ? '#9B59B6' : '#2C3E50', marginTop: '4px' }}>
              {isBlind ? <EyeOff size={24} color="#9B59B6" /> : <Eye size={24} color="#38B07D" />}
              <span>{isBlind ? 'Blind Pulse' : timerState === 'running' ? 'Calibrating (0-2s)...' : 'Ready'}</span>
            </div>
          </div>
        </div>

        {/* Giant Digital Chronometer Display */}
        <div
          style={{
            maxWidth: '780px',
            height: '280px',
            margin: '0 auto',
            borderRadius: '28px',
            backgroundColor: isBlind ? '#141824' : '#2C3E50',
            border: `4px solid ${isBlind ? '#9B59B6' : '#34495E'}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 16px 36px rgba(0,0,0,0.22)',
            transition: 'background-color 0.5s ease, border-color 0.5s ease',
          }}
        >
          {/* Pulsating purple aura in Blind mode */}
          {isBlind && (
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2] }}
              transition={{ repeat: Infinity, duration: 1.0 }}
              style={{
                position: 'absolute',
                width: '240px',
                height: '240px',
                borderRadius: '50%',
                backgroundColor: '#9B59B6',
                filter: 'blur(50px)',
                pointerEvents: 'none',
              }}
            />
          )}

          <div style={{ position: 'relative', zIndex: 2 }}>
            {timerState === 'idle' && (
              <div>
                <div style={{ fontSize: '5rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '3px', fontFamily: 'monospace', lineHeight: 1.1 }}>
                  00:00.00
                </div>
                <div style={{ color: '#BDC3C7', fontSize: '1.05rem', fontWeight: 700, marginTop: '8px' }}>
                  Press Start Timer or hit Spacebar
                </div>
              </div>
            )}

            {timerState === 'running' && !isBlind && (
              <div>
                <div style={{ fontSize: '5rem', fontWeight: 900, color: '#2ECC71', letterSpacing: '3px', fontFamily: 'monospace', lineHeight: 1.1 }}>
                  00:{formatSecondsWithMs(elapsedMs).padStart(5, '0')}
                </div>
                <div style={{ color: '#F1C40F', fontSize: '1rem', fontWeight: 800, marginTop: '8px' }}>
                  Calibrating tempo... Fading into Blind Mode in a moment!
                </div>
              </div>
            )}

            {timerState === 'running' && isBlind && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center' }}
              >
                <div style={{ fontSize: '3.6rem', fontWeight: 900, color: '#E056FD', letterSpacing: '6px', textShadow: '0 0 24px rgba(224, 86, 253, 0.8)' }}>
                  EYES CLOSED
                </div>
                <div style={{ color: '#FFFFFF', fontSize: '1.2rem', fontWeight: 800, marginTop: '10px' }}>
                  Feel the pulse &bull; Press STOP at exactly {targetSeconds.toFixed(2)}s!
                </div>
              </motion.div>
            )}

            {timerState === 'revealed' && differenceMs !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center' }}
              >
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#BDC3C7', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Your Stopped Time
                </div>
                <div style={{ fontSize: '5rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '3px', fontFamily: 'monospace', lineHeight: 1.1 }}>
                  00:{formatSecondsWithMs(elapsedMs).padStart(5, '0')}
                </div>
                <div
                  style={{
                    display: 'inline-block',
                    marginTop: '8px',
                    padding: '6px 20px',
                    borderRadius: '999px',
                    backgroundColor: Math.abs(differenceMs) <= 250 ? '#27AE60' : Math.abs(differenceMs) <= 600 ? '#2980B9' : '#C0392B',
                    color: '#FFFFFF',
                    fontSize: '1.15rem',
                    fontWeight: 900,
                  }}
                >
                  Delta: {differenceMs >= 0 ? `+${(differenceMs / 1000).toFixed(2)}s` : `${(differenceMs / 1000).toFixed(2)}s`}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Result Evaluation Banner */}
        <AnimatePresence>
          {timerState === 'revealed' && rating && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: '16px',
                padding: '10px 24px',
                borderRadius: '16px',
                backgroundColor: rating.bg,
                color: rating.color,
                fontWeight: 900,
                fontSize: '1.15rem',
                display: 'inline-block',
                boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
              }}
            >
              {rating.title} &bull; +{rating.pts} Points
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Controls */}
        <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {timerState === 'idle' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              onClick={handleStartTimer}
              className="btn-squishy btn-sun"
              style={{
                padding: '14px 48px',
                fontSize: '1.3rem',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: '#38B07D',
                borderColor: '#248259',
                borderRadius: '999px',
              }}
            >
              <Play size={24} fill="#FFFFFF" />
              <span>Start Timer</span>
            </motion.button>
          )}

          {timerState === 'running' && (
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={handleStopTimer}
              className="btn-squishy btn-sun"
              style={{
                padding: '16px 54px',
                fontSize: '1.4rem',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: '#E74C3C',
                borderColor: '#C0392B',
                boxShadow: '0 10px 30px rgba(231, 76, 60, 0.45)',
                borderRadius: '999px',
              }}
            >
              <Square size={26} fill="#FFFFFF" />
              <span>STOP NOW!</span>
            </motion.button>
          )}

          {timerState === 'revealed' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                onClick={handleResetNewTarget}
                className="btn-squishy btn-sun"
                style={{
                  padding: '12px 32px',
                  fontSize: '1.15rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: '#9B59B6',
                  borderColor: '#7D3C98',
                }}
              >
                <RotateCcw size={22} />
                <span>Try Another Target</span>
              </motion.button>

              <button
                onClick={() => {
                  sounds.playTap();
                  onBack();
                }}
                className="btn-squishy btn-outline"
                style={{ padding: '12px 28px', fontSize: '1.1rem' }}
              >
                Back to Map
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
