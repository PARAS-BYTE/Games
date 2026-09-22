import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Square,
  Eye,
  EyeOff,
  RotateCcw,
  ArrowLeft,
  Trophy,
  Sparkles,
  Trash2,
  User,
  Flame,
  UserCheck,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../../audio/soundEngine';

export interface ChronoLeaderboardEntry {
  id: string;
  name: string;
  accuracy: number; // percentage e.g. 99.45
  deltaMs: number; // millisecond difference (+ or -)
  absDiffMs: number;
  targetSeconds: number;
  stoppedSeconds: number;
  pts: number;
  dateStr: string;
}

const STORAGE_KEY = 'chronopulse_leaderboard_top5';
const NAME_STORAGE_KEY = 'chronopulse_last_player_name';

export const ChronoPulse: React.FC<{
  onBack: () => void;
}> = ({ onBack }) => {
  // Random target generator
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

  // Active Player Name & Pre-run registration modal (shown before every run)
  const [playerName, setPlayerName] = useState<string>(() => {
    try {
      return localStorage.getItem(NAME_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const [nameInputValue, setNameInputValue] = useState<string>(() => {
    try {
      return localStorage.getItem(NAME_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const [isNameModalOpen, setIsNameModalOpen] = useState<boolean>(false);
  const [nameModalError, setNameModalError] = useState<string | null>(null);

  // Leaderboard data
  const [leaderboard, setLeaderboard] = useState<ChronoLeaderboardEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.slice(0, 5);
      }
    } catch (e) {
      console.error('Failed to load leaderboard', e);
    }
    return [];
  });

  const [highlightedEntryId, setHighlightedEntryId] = useState<string | null>(null);
  const [lastRoundPlacement, setLastRoundPlacement] = useState<number | null>(null);

  const startTimestampRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const modalInputRef = useRef<HTMLInputElement | null>(null);

  // When modal opens before a run, auto-focus and select previous name for quick 1-key confirmation
  useEffect(() => {
    if (isNameModalOpen) {
      setTimeout(() => {
        if (modalInputRef.current) {
          modalInputRef.current.focus();
          modalInputRef.current.select();
        }
      }, 80);
    }
  }, [isNameModalOpen]);

  // Calculate percentage accuracy
  const calculateAccuracy = (targetSec: number, diffMs: number) => {
    const targetMs = targetSec * 1000;
    const absDiff = Math.abs(diffMs);
    const acc = Math.max(0, (1 - absDiff / targetMs) * 100);
    return Number(acc.toFixed(2));
  };

  const handleResetNewTarget = () => {
    sounds.playTap();
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setTimerState('idle');
    setElapsedMs(0);
    setIsBlind(false);
    setDifferenceMs(null);
    setRating(null);
    setLastRoundPlacement(null);
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

  // Request to start timer: Prompts for runner name before EVERY run
  const handleRequestStartTimer = () => {
    if (timerState !== 'idle') return;
    sounds.playTap();
    // Prepare name input with current or saved name
    const defaultName = playerName || localStorage.getItem(NAME_STORAGE_KEY) || '';
    setNameInputValue(defaultName);
    setNameModalError(null);
    setIsNameModalOpen(true);
  };

  // Confirm runner name and immediately launch timer
  const handleConfirmAndStartTimer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = nameInputValue.trim();
    if (!trimmed) {
      setNameModalError('Please enter runner name for this trial!');
      return;
    }

    setNameModalError(null);
    setPlayerName(trimmed);
    try {
      localStorage.setItem(NAME_STORAGE_KEY, trimmed);
    } catch (err) {
      console.error('Failed to save name to localStorage', err);
    }

    setIsNameModalOpen(false);

    // Immediately start the chronometer run
    sounds.playTap();
    setTimerState('running');
    setIsBlind(false);
    setElapsedMs(0);
    setDifferenceMs(null);
    setRating(null);
    setLastRoundPlacement(null);
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

    let currentRating = { title: 'Off Target! Try Calibrating Again', color: '#FFFFFF', bg: '#C0392B', pts: 40 };

    // Precision calculation & rating
    if (absDiff <= 250) {
      currentRating = { title: 'Chrono Master! (Flawless Internal Clock)', color: '#FFFFFF', bg: '#27AE60', pts: 200 };
    } else if (absDiff <= 600) {
      currentRating = { title: 'Great Chrono Sense! (Very Sharp)', color: '#FFFFFF', bg: '#2980B9', pts: 150 };
    } else if (absDiff <= 1200) {
      currentRating = { title: 'Close Perception! (Within a Second)', color: '#FFFFFF', bg: '#F39C12', pts: 90 };
    }

    setRating(currentRating);

    // Record score directly under runner's name for this trial
    const currentAcc = calculateAccuracy(targetSeconds, diff);
    const activeName = playerName.trim() || 'Player';
    const newEntry: ChronoLeaderboardEntry = {
      id: 'cb_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name: activeName,
      accuracy: currentAcc,
      deltaMs: Math.round(diff),
      absDiffMs: Math.abs(Math.round(diff)),
      targetSeconds,
      stoppedSeconds: Number((totalElapsed / 1000).toFixed(2)),
      pts: currentRating.pts,
      dateStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Combine and sort by accuracy descending (highest accuracy first)
    const updated = [...leaderboard, newEntry]
      .sort((a, b) => {
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
        return a.absDiffMs - b.absDiffMs;
      })
      .slice(0, 5);

    const placementIndex = updated.findIndex((item) => item.id === newEntry.id);
    const madeTop5 = placementIndex !== -1;

    setLeaderboard(updated);
    setHighlightedEntryId(newEntry.id);

    if (madeTop5) {
      setLastRoundPlacement(placementIndex + 1);
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#F5A623', '#9B59B6', '#38B07D', '#3CA2FF', '#FF6565'],
      });
      sounds.playVictory();
    } else {
      setLastRoundPlacement(null);
      if (absDiff <= 600) {
        sounds.playCorrect();
      } else {
        sounds.playIncorrect();
      }
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Error saving leaderboard', err);
    }
  };

  // Clear leaderboard
  const handleClearLeaderboard = () => {
    if (window.confirm('Are you sure you want to reset the Top 5 Leaderboard?')) {
      sounds.playTap();
      setLeaderboard([]);
      setHighlightedEntryId(null);
      setLastRoundPlacement(null);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.error('Error clearing leaderboard', e);
      }
    }
  };

  // Keyboard shortcut: Spacebar triggers name prompt if idle, or stops timer if running
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If modal is open or typing in input, spacebar should type normally
      if (isNameModalOpen || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        if (timerState === 'idle') {
          handleRequestStartTimer();
        } else if (timerState === 'running') {
          handleStopTimer();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timerState, isNameModalOpen, playerName]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const formatSecondsWithMs = (ms: number) => {
    const totalSec = ms / 1000;
    return totalSec.toFixed(2);
  };

  const currentAccPreview = differenceMs !== null ? calculateAccuracy(targetSeconds, differenceMs) : null;

  // Find player's best rank on the current leaderboard
  const playerTopRank = leaderboard.findIndex((item) => item.name.toLowerCase() === playerName.toLowerCase().trim()) + 1;
  const playerBestScore = leaderboard.find((item) => item.name.toLowerCase() === playerName.toLowerCase().trim());

  return (
    <div style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '12px 20px', minHeight: '94vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 22px',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          border: '3px solid #F0EAE1',
          boxShadow: '0 6px 18px rgba(44, 62, 80, 0.04)',
          marginBottom: '16px',
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
              <h1 style={{ fontSize: '1.65rem', color: '#2C3E50', margin: 0, fontWeight: 900 }}>
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
              Internal Chronometer &bull; Prompt Runner Before Every Run &bull; Top 5 Accuracy Board
            </div>
          </div>
        </div>

        {/* Active Player Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div
            onClick={handleRequestStartTimer}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '999px',
              backgroundColor: '#E8F8F0',
              border: '2px solid #38B07D',
              color: '#248259',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.9rem',
              transition: 'transform 0.15s ease',
            }}
            title="Next Runner"
          >
            <UserCheck size={16} />
            <span>Next Runner: <strong>{playerName || 'Ready to enter'}</strong></span>
          </div>

          <span
            style={{
              fontSize: '0.82rem',
              fontWeight: 800,
              padding: '6px 14px',
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

      {/* Main Split-Screen Container: Left Clock Panel & Right Leaderboard Panel */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.35fr) minmax(340px, 1fr)',
          gap: '20px',
          alignItems: 'start',
          flex: 1,
        }}
        className="chrono-split-grid"
      >
        {/* ================= LEFT SIDE: CLOCK & GAMEPLAY ================= */}
        <div
          className="toy-card"
          style={{
            padding: '20px 24px',
            textAlign: 'center',
            backgroundColor: '#FFFFFF',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {/* Target Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #FAF7F2 0%, #FEF9E7 100%)',
              border: '3px solid #F5A623',
              borderRadius: '20px',
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 900, color: '#A6720A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Target Time (Stop Here!)
              </div>
              <div style={{ fontSize: '2.6rem', fontWeight: 900, color: '#C97E06', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                {targetSeconds.toFixed(2)}s
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 900, color: '#667C89', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Chronometer Mode
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', fontWeight: 900, color: isBlind ? '#9B59B6' : '#2C3E50', marginTop: '4px' }}>
                {isBlind ? <EyeOff size={22} color="#9B59B6" /> : <Eye size={22} color="#38B07D" />}
                <span>{isBlind ? 'Blind Pulse' : timerState === 'running' ? 'Calibrating (0-2s)...' : 'Ready'}</span>
              </div>
            </div>
          </div>

          {/* Giant Digital Chronometer Display */}
          <div
            style={{
              width: '100%',
              height: '240px',
              borderRadius: '24px',
              backgroundColor: isBlind ? '#141824' : '#2C3E50',
              border: `4px solid ${isBlind ? '#9B59B6' : '#34495E'}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 14px 32px rgba(0,0,0,0.2)',
              transition: 'background-color 0.5s ease, border-color 0.5s ease',
            }}
          >
            {/* Pulsating purple aura in Blind mode */}
            {isBlind && (
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.25, 0.55, 0.25] }}
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

            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
              {timerState === 'idle' && (
                <div>
                  <div style={{ fontSize: '4.4rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '3px', fontFamily: 'monospace', lineHeight: 1.1 }}>
                    00:00.00
                  </div>
                  <div style={{ color: '#BDC3C7', fontSize: '1rem', fontWeight: 700, marginTop: '8px' }}>
                    Press Start Timer to enter runner name &amp; begin!
                  </div>
                </div>
              )}

              {timerState === 'running' && !isBlind && (
                <div>
                  <div style={{ fontSize: '4.4rem', fontWeight: 900, color: '#2ECC71', letterSpacing: '3px', fontFamily: 'monospace', lineHeight: 1.1 }}>
                    00:{formatSecondsWithMs(elapsedMs).padStart(5, '0')}
                  </div>
                  <div style={{ color: '#F1C40F', fontSize: '0.95rem', fontWeight: 800, marginTop: '8px' }}>
                    Runner: <strong>{playerName}</strong> &bull; Blind mode in a moment!
                  </div>
                </div>
              )}

              {timerState === 'running' && isBlind && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ textAlign: 'center' }}
                >
                  <div style={{ fontSize: '3.2rem', fontWeight: 900, color: '#E056FD', letterSpacing: '6px', textShadow: '0 0 24px rgba(224, 86, 253, 0.8)' }}>
                    EYES CLOSED
                  </div>
                  <div style={{ color: '#FFFFFF', fontSize: '1.1rem', fontWeight: 800, marginTop: '10px' }}>
                    Go <strong>{playerName}</strong>! Stop at exactly {targetSeconds.toFixed(2)}s!
                  </div>
                </motion.div>
              )}

              {timerState === 'revealed' && differenceMs !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ textAlign: 'center' }}
                >
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#BDC3C7', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {playerName}&apos;s Stopped Time
                  </div>
                  <div style={{ fontSize: '4.4rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '3px', fontFamily: 'monospace', lineHeight: 1.1 }}>
                    00:{formatSecondsWithMs(elapsedMs).padStart(5, '0')}
                  </div>
                  <div
                    style={{
                      display: 'inline-block',
                      marginTop: '6px',
                      padding: '4px 18px',
                      borderRadius: '999px',
                      backgroundColor: Math.abs(differenceMs) <= 250 ? '#27AE60' : Math.abs(differenceMs) <= 600 ? '#2980B9' : '#C0392B',
                      color: '#FFFFFF',
                      fontSize: '1.1rem',
                      fontWeight: 900,
                    }}
                  >
                    Delta: {differenceMs >= 0 ? `+${(differenceMs / 1000).toFixed(2)}s` : `${(differenceMs / 1000).toFixed(2)}s`} ({currentAccPreview}% Accuracy)
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Rating Evaluation Badge */}
          <AnimatePresence>
            {timerState === 'revealed' && rating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '8px 20px',
                  borderRadius: '16px',
                  backgroundColor: rating.bg,
                  color: rating.color,
                  fontWeight: 900,
                  fontSize: '1.05rem',
                  display: 'inline-block',
                  margin: '0 auto',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                }}
              >
                {rating.title} &bull; +{rating.pts} Points
              </motion.div>
            )}
          </AnimatePresence>

          {/* Round Result & Auto-Saved Banner */}
          <AnimatePresence>
            {timerState === 'revealed' && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  backgroundColor: lastRoundPlacement ? '#FEF9E7' : '#F4F6F7',
                  border: lastRoundPlacement ? '2px solid #F5A623' : '2px solid #D5D8DC',
                  borderRadius: '18px',
                  padding: '12px 20px',
                  textAlign: 'center',
                }}
              >
                {lastRoundPlacement ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#B7791F', fontWeight: 900, fontSize: '1.05rem' }}>
                    <Sparkles size={20} color="#F5A623" />
                    <span>
                      🎉 Phenomenal, <strong>{playerName}</strong>! You scored <strong>#{lastRoundPlacement}</strong> on the Leaderboard!
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#5D6D7E', fontWeight: 800, fontSize: '0.95rem' }}>
                    <UserCheck size={18} color="#38B07D" />
                    <span>
                      Run saved for <strong>{playerName}</strong> ({currentAccPreview}% accuracy). Hit Try Another Target to run again!
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Controls */}
          <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            {timerState === 'idle' && (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRequestStartTimer}
                className="btn-squishy btn-sun"
                style={{
                  padding: '14px 44px',
                  fontSize: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: '#38B07D',
                  borderColor: '#248259',
                  borderRadius: '999px',
                }}
              >
                <Play size={22} fill="#FFFFFF" />
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
                  padding: '16px 50px',
                  fontSize: '1.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: '#E74C3C',
                  borderColor: '#C0392B',
                  boxShadow: '0 10px 30px rgba(231, 76, 60, 0.45)',
                  borderRadius: '999px',
                }}
              >
                <Square size={24} fill="#FFFFFF" />
                <span>STOP NOW!</span>
              </motion.button>
            )}

            {timerState === 'revealed' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleResetNewTarget}
                  className="btn-squishy btn-sun"
                  style={{
                    padding: '12px 28px',
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#9B59B6',
                    borderColor: '#7D3C98',
                  }}
                >
                  <RotateCcw size={20} />
                  <span>Try Another Target</span>
                </motion.button>

                <button
                  onClick={() => {
                    sounds.playTap();
                    onBack();
                  }}
                  className="btn-squishy btn-outline"
                  style={{ padding: '12px 22px', fontSize: '1.05rem' }}
                >
                  Back to Map
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT SIDE: HIGH-AESTHETIC TOP 5 LEADERBOARD ================= */}
        <div
          className="toy-card"
          style={{
            padding: '20px 22px',
            backgroundColor: '#FFFFFF',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 12px 30px rgba(44, 62, 80, 0.07)',
          }}
        >
          {/* Leaderboard Header with Gold Accent */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #FFFDF0 0%, #FEF5D1 100%)',
              border: '2px solid #F5A623',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 4px 10px rgba(245, 166, 35, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#F5A623',
                }}
              >
                <Trophy size={26} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '1.28rem', fontWeight: 900, color: '#2C3E50', margin: 0 }}>
                    Hall of Fame
                  </h2>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 900,
                      backgroundColor: '#F5A623',
                      color: '#FFFFFF',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      letterSpacing: '0.5px',
                    }}
                  >
                    TOP 5
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#8A6D3B', fontWeight: 800 }}>
                  Highest Accuracy Internal Timers
                </div>
              </div>
            </div>

            {leaderboard.length > 0 && (
              <button
                onClick={handleClearLeaderboard}
                title="Reset Top 5 Leaderboard"
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #F0DDB3',
                  cursor: 'pointer',
                  color: '#A09687',
                  padding: '7px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#E74C3C';
                  e.currentTarget.style.borderColor = '#FF8E8E';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#A09687';
                  e.currentTarget.style.borderColor = '#F0DDB3';
                }}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          {/* Active Challenger Mini Summary */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              backgroundColor: '#F8FAF9',
              borderRadius: '14px',
              border: '1.5px solid #E5ECE8',
              fontSize: '0.85rem',
              fontWeight: 800,
              color: '#34495E',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={16} color="#38B07D" />
              <span>Current Runner: <strong>{playerName || 'None'}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {playerTopRank > 0 ? (
                <span style={{ color: '#27AE60', backgroundColor: '#E8F8F0', padding: '2px 8px', borderRadius: '999px' }}>
                  Rank #{playerTopRank} ({playerBestScore?.accuracy}%)
                </span>
              ) : (
                <span style={{ color: '#7F8C8D' }}>No Rank Yet</span>
              )}
            </div>
          </div>

          {/* Top 5 Entries List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {leaderboard.length === 0 ? (
              <div
                style={{
                  padding: '38px 18px',
                  textAlign: 'center',
                  backgroundColor: '#FDFBF7',
                  borderRadius: '20px',
                  border: '2px dashed #E2D9CC',
                }}
              >
                <div style={{ fontSize: '2.8rem', marginBottom: '8px' }}>⏱️</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#2C3E50' }}>
                  The Podium is Empty!
                </div>
                <div style={{ fontSize: '0.86rem', color: '#7F8C8D', fontWeight: 700, marginTop: '6px', maxWidth: '260px', margin: '6px auto 0' }}>
                  Hit Start Timer, lock in your name, and stop blind with precision to claim #1!
                </div>
              </div>
            ) : (
              leaderboard.map((entry, index) => {
                const isFirst = index === 0;
                const isSecond = index === 1;
                const isThird = index === 2;
                const isHighlighted = entry.id === highlightedEntryId;

                // Rich rank-specific styles
                let cardBg = '#FFFFFF';
                let cardBorder = '2px solid #EBE7DF';
                let medalBadge = `#${index + 1}`;
                let medalBg = '#F2F3F4';
                let medalColor = '#566573';
                let rankTitle = '';

                if (isFirst) {
                  cardBg = 'linear-gradient(135deg, #FFFDF0 0%, #FEF8DC 100%)';
                  cardBorder = '2.5px solid #F5A623';
                  medalBadge = '🥇';
                  medalBg = '#FFFFFF';
                  medalColor = '#B7791F';
                  rankTitle = 'CHAMPION';
                } else if (isSecond) {
                  cardBg = 'linear-gradient(135deg, #FAFAFB 0%, #F0F3F4 100%)';
                  cardBorder = '2px solid #BDC3C7';
                  medalBadge = '🥈';
                  medalBg = '#FFFFFF';
                  medalColor = '#5D6D7E';
                  rankTitle = 'RUNNER UP';
                } else if (isThird) {
                  cardBg = 'linear-gradient(135deg, #FDF9F5 0%, #FBEFE7 100%)';
                  cardBorder = '2px solid #E59866';
                  medalBadge = '🥉';
                  medalBg = '#FFFFFF';
                  medalColor = '#A0522D';
                  rankTitle = 'PODIUM';
                }

                if (isHighlighted) {
                  cardBorder = '2.5px solid #38B07D';
                }

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.05 }}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '18px',
                      background: cardBg,
                      border: cardBorder,
                      boxShadow: isHighlighted ? '0 6px 20px rgba(56, 176, 125, 0.25)' : '0 3px 10px rgba(0,0,0,0.03)',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    {/* Top Row: Medal, Player Name, Accuracy Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '12px',
                            backgroundColor: medalBg,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.15rem',
                            fontWeight: 900,
                            color: medalColor,
                            flexShrink: 0,
                          }}
                        >
                          {medalBadge}
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                fontSize: '1.05rem',
                                fontWeight: 900,
                                color: '#2C3E50',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '140px',
                              }}
                            >
                              {entry.name}
                            </span>
                            {rankTitle && (
                              <span
                                style={{
                                  fontSize: '0.62rem',
                                  fontWeight: 900,
                                  backgroundColor: isFirst ? '#F5A623' : isSecond ? '#BDC3C7' : '#E59866',
                                  color: '#FFFFFF',
                                  padding: '1px 6px',
                                  borderRadius: '999px',
                                }}
                              >
                                {rankTitle}
                              </span>
                            )}
                            {isHighlighted && (
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 900,
                                  backgroundColor: '#38B07D',
                                  color: '#FFFFFF',
                                  padding: '1px 7px',
                                  borderRadius: '999px',
                                }}
                              >
                                LATEST
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#7F8C8D', fontWeight: 700 }}>
                            Target: {entry.targetSeconds.toFixed(2)}s &bull; Stopped: {entry.stoppedSeconds.toFixed(2)}s
                          </div>
                        </div>
                      </div>

                      {/* Right: Accuracy Pill */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div
                          style={{
                            fontSize: '1.12rem',
                            fontWeight: 900,
                            color: entry.accuracy >= 98 ? '#27AE60' : entry.accuracy >= 95 ? '#2980B9' : '#C0392B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '4px',
                          }}
                        >
                          {entry.accuracy >= 99 && <Flame size={15} color="#E74C3C" />}
                          <span>{entry.accuracy}%</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#95A5A6', fontWeight: 800 }}>
                          Delta: {entry.deltaMs >= 0 ? `+${(entry.deltaMs / 1000).toFixed(2)}s` : `${(entry.deltaMs / 1000).toFixed(2)}s`}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Accuracy Bar Meter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          flex: 1,
                          height: '6px',
                          backgroundColor: '#EAE5DB',
                          borderRadius: '999px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.max(5, Math.min(100, entry.accuracy))}%`,
                            height: '100%',
                            background: isFirst
                              ? 'linear-gradient(90deg, #F5A623, #F39C12)'
                              : entry.accuracy >= 98
                              ? 'linear-gradient(90deg, #38B07D, #27AE60)'
                              : 'linear-gradient(90deg, #3CA2FF, #1E74C4)',
                            borderRadius: '999px',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#A09687', fontWeight: 800 }}>
                        {entry.dateStr}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Quick Tip / Info Footer in Leaderboard Card */}
          <div
            style={{
              marginTop: 'auto',
              paddingTop: '10px',
              borderTop: '1.5px solid #F4EFEA',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#95A5A6',
              fontSize: '0.78rem',
              fontWeight: 700,
            }}
          >
            <span>💡 <strong>Tip:</strong> Closer stop time to target = higher accuracy %. Persisted in your browser!</span>
          </div>
        </div>
      </div>

      {/* ================= PRE-RUN NAME REGISTRATION MODAL (BEFORE RUNNING EVERY TIME) ================= */}
      <AnimatePresence>
        {isNameModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(30, 40, 50, 0.65)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              zIndex: 1000,
            }}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 20 }}
              style={{
                maxWidth: '460px',
                width: '100%',
                backgroundColor: '#FFFFFF',
                borderRadius: '28px',
                padding: '28px 26px',
                textAlign: 'center',
                boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                border: '4px solid #F0EAE1',
              }}
            >
              {/* Target Preview Tag */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 14px',
                  borderRadius: '999px',
                  backgroundColor: '#FEF7E6',
                  border: '2px solid #F5A623',
                  color: '#C97E06',
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  marginBottom: '12px',
                }}
              >
                <span>🎯 Target to hit:</span>
                <span style={{ fontSize: '1.05rem', color: '#B7791F' }}>{targetSeconds.toFixed(2)}s</span>
              </div>

              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#2C3E50', marginBottom: '6px' }}>
                Who is Running This Trial?
              </h2>
              <p style={{ color: '#7F8C8D', fontSize: '0.92rem', fontWeight: 700, marginBottom: '20px', lineHeight: 1.4 }}>
                Enter runner name for this trial. Hit Enter or Start to launch the clock immediately!
              </p>

              <form onSubmit={handleConfirmAndStartTimer}>
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <User size={20} color="#7F8C8D" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    ref={modalInputRef}
                    type="text"
                    maxLength={18}
                    value={nameInputValue}
                    onChange={(e) => {
                      setNameInputValue(e.target.value);
                      if (nameModalError) setNameModalError(null);
                    }}
                    placeholder="Type name (e.g. Paras, Alex...)"
                    style={{
                      width: '100%',
                      padding: '12px 16px 12px 46px',
                      borderRadius: '16px',
                      border: nameModalError ? '2.5px solid #FF6565' : '2px solid #D4C9B8',
                      fontSize: '1.1rem',
                      fontFamily: 'inherit',
                      fontWeight: 800,
                      color: '#2C3E50',
                      backgroundColor: '#FAF7F2',
                      outline: 'none',
                    }}
                  />
                </div>

                {nameModalError && (
                  <div style={{ color: '#D44242', fontSize: '0.85rem', fontWeight: 800, marginBottom: '14px' }}>
                    {nameModalError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setIsNameModalOpen(false);
                    }}
                    className="btn-squishy btn-outline"
                    style={{ padding: '12px 20px', fontSize: '1rem', flex: 1 }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn-squishy btn-mint"
                    style={{ padding: '12px 26px', fontSize: '1.05rem', flex: 2, gap: '8px' }}
                  >
                    <Play size={18} fill="#FFFFFF" />
                    <span>Launch Timer!</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
