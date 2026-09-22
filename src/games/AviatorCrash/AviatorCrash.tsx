import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Trophy,
  Zap,
  RotateCcw,
  Square,
  Play,
  Trash2,
  UserCheck,
  User,
  Sparkles,
  HelpCircle,
  Compass,
  EyeOff,
  Timer,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../../audio/soundEngine';

export interface AeroAccuracyLeaderboardEntry {
  id: string;
  name: string;
  accuracy: number; // e.g. 98.45%
  stoppedMultiplier: number;
  blastMultiplier: number;
  diffMultiplier?: number;
  patternRule: string;
  pts: number;
  dateStr: string;
}

interface PatternSequence {
  name: string;
  description: string;
  historyPills: number[]; // past 4 to 5 flights
  actualBlastTarget: number;
  ruleExplanation: string;
  isInstantStall: boolean;
}

const STORAGE_KEY = 'aero_accuracy_leaderboard_top5';
const NAME_STORAGE_KEY = 'aero_velocity_last_student_name';

export const AviatorCrash: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  // Player name state
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

  const [isNameModalOpen, setIsNameModalOpen] = useState<boolean>(() => {
    try {
      return !(localStorage.getItem(NAME_STORAGE_KEY) || '').trim();
    } catch {
      return true;
    }
  });
  const [nameModalError, setNameModalError] = useState<string | null>(null);
  const modalInputRef = useRef<HTMLInputElement | null>(null);

  // Top 5 Accuracy Leaderboard
  const [leaderboard, setLeaderboard] = useState<AeroAccuracyLeaderboardEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.slice(0, 5);
      }
    } catch {
      // fallback
    }
    return [
      { id: '1', name: 'Dr. Arya Raman', accuracy: 98.65, stoppedMultiplier: 5.92, blastMultiplier: 6.00, diffMultiplier: 0.08, patternRule: 'Linear (+1.5x)', pts: 1105, dateStr: 'Today' },
      { id: '2', name: 'Advait Sharma', accuracy: 96.25, stoppedMultiplier: 7.70, blastMultiplier: 8.00, diffMultiplier: 0.30, patternRule: 'Geometric (x2)', pts: 1045, dateStr: 'Today' },
      { id: '3', name: 'Priya Patel', accuracy: 93.33, stoppedMultiplier: 2.80, blastMultiplier: 3.00, diffMultiplier: 0.20, patternRule: 'Alternating', pts: 993, dateStr: 'Today' },
    ];
  });

  const [highlightedEntryId, setHighlightedEntryId] = useState<string | null>(null);
  const [lastRoundPlacement, setLastRoundPlacement] = useState<number | null>(null);

  // Sound mute state
  const [isMuted, setIsMuted] = useState(sounds.getIsMuted());
  const handleToggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
    if (!muted) sounds.playTap();
  };

  // Phase State:
  // 'deduction' = Pattern of past 4-5 flights shown for 5 seconds countdown
  // 'running'   = Pattern hidden! Plane flying off! User stops before blast!
  // 'revealed'  = Outcome evaluated (Accuracy %, Leaderboard updated)
  const [phase, setPhase] = useState<'deduction' | 'running' | 'revealed'>('deduction');
  const [patternSecondsLeft, setPatternSecondsLeft] = useState<number>(5.0);

  const [, setCurrentMultiplier] = useState<number>(1.0);
  const [trialsSinceInstantStall, setTrialsSinceInstantStall] = useState<number>(0);

  // Active Pattern Puzzle for THIS Flight (Past 4-5 flights)
  const [activePattern, setActivePattern] = useState<PatternSequence>({
    name: 'Arithmetic Progression (+1.20x)',
    description: 'Each blast increases by +1.20x',
    historyPills: [1.2, 2.4, 3.6, 4.8],
    actualBlastTarget: 6.0,
    ruleExplanation: 'Past flights: 1.20 -> 2.40 -> 3.60 -> 4.80. Adds +1.20x each time, so next blast = 6.00x!',
    isInstantStall: false,
  });

  // Results
  const [stoppedMultiplier, setStoppedMultiplier] = useState<number | null>(null);
  const [wasBlastedBeforeStop, setWasBlastedBeforeStop] = useState<boolean>(false);
  const [roundAccuracy, setRoundAccuracy] = useState<number | null>(null);
  const [roundPoints, setRoundPoints] = useState<number>(0);
  const [performanceRating, setPerformanceRating] = useState<{ title: string; color: string; bg: string } | null>(null);

  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [screenShake, setScreenShake] = useState<boolean>(false);

  // Canvas & Direct Animation refs (Bypasses React re-render thrashing for butter-smooth 60fps stability)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flightStartTimeRef = useRef<number>(0);
  const currentMultiplierRef = useRef<number>(1.0);
  const multiplierTextRef = useRef<HTMLDivElement | null>(null);

  // Scientific wind-tunnel streamlines & equations
  const airflowStreams = useRef<Array<{ y: number; speed: number; length: number; alpha: number }>>([]);
  const exhaustParticles = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number; size: number; color: string }>>([]);
  const stallParticles = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number; size: number; color: string }>>([]);
  const mathSymbols = useRef<Array<{ x: number; y: number; text: string; alpha: number; speed: number; size: number }>>([]);

  useEffect(() => {
    const streams = [];
    for (let i = 0; i < 22; i++) {
      streams.push({
        y: Math.random() * 340,
        speed: Math.random() * 3 + 2,
        length: Math.random() * 80 + 40,
        alpha: Math.random() * 0.25 + 0.08,
      });
    }
    airflowStreams.current = streams;

    const symbols = ['Acc=(Stop/Blast)*100', 'M(t)=e^{kt}', 'Δv', 'PatternDeduction', 'λ=0.08', 'Re=10⁵', 'F_L/F_D'];
    const formulaList = [];
    for (let i = 0; i < 8; i++) {
      formulaList.push({
        x: Math.random() * 750,
        y: Math.random() * 300 + 20,
        text: symbols[i % symbols.length],
        alpha: Math.random() * 0.18 + 0.06,
        speed: Math.random() * 0.3 + 0.15,
        size: Math.floor(Math.random() * 3 + 10),
      });
    }
    mathSymbols.current = formulaList;
  }, []);

  // Set internal canvas resolution ONCE on mount (prevents context wiping & layout instability)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 800;
    canvas.height = 360;
    renderStudyCanvas(1.0, false);
  }, []);

  // --- DYNAMIC PATTERN GENERATOR (Past 4-5 Flights + 1-in-5-to-6 Instant Stall) ---
  const generateNewPatternPuzzle = useCallback((): PatternSequence => {
    const isStallRound = trialsSinceInstantStall >= 4 && (trialsSinceInstantStall >= 6 || Math.random() < 0.45);

    if (isStallRound) {
      setTrialsSinceInstantStall(0);
      const pastPills = [3.4, 5.1, 7.8, 12.0];
      const stallPoint = Number((1.01 + Math.random() * 0.06).toFixed(2));
      return {
        name: 'Aerodynamic Stall Anomaly (Outlier)',
        description: 'Atmospheric pressure failure creates sudden early stall!',
        historyPills: pastPills,
        actualBlastTarget: stallPoint,
        ruleExplanation: `Early stall anomaly! Flight failed immediately at ${stallPoint}x (approx 1 in 5-6 outlier event).`,
        isInstantStall: true,
      };
    }

    setTrialsSinceInstantStall((prev) => prev + 1);

    const patternArchetypes = [
      () => {
        const diff = Number((0.8 + Math.random() * 1.5).toFixed(2));
        const base = Number((1.2 + Math.random() * 1.8).toFixed(2));
        const count = 4;
        const history: number[] = [];
        for (let i = 0; i < count; i++) {
          history.push(Number((base + i * diff).toFixed(2)));
        }
        const target = Number((base + count * diff).toFixed(2));
        return {
          name: `Linear Progression (+${diff.toFixed(2)}x)`,
          description: `Each flight blast increases steadily by +${diff.toFixed(2)}x`,
          historyPills: history,
          actualBlastTarget: target,
          ruleExplanation: `Past flights: ${history.join(' -> ')}. Constant increase of +${diff.toFixed(2)}x yields target = ${target.toFixed(2)}x!`,
          isInstantStall: false,
        };
      },
      () => {
        const ratio = Number((1.35 + Math.random() * 0.45).toFixed(2));
        const base = Number((1.1 + Math.random() * 0.6).toFixed(2));
        const count = 4;
        const history: number[] = [];
        let curr = base;
        for (let i = 0; i < count; i++) {
          history.push(Number(curr.toFixed(2)));
          curr = curr * ratio;
        }
        const target = Number(curr.toFixed(2));
        return {
          name: `Exponential Scaling (x${ratio.toFixed(2)})`,
          description: `Each blast multiplies by approximately x${ratio.toFixed(2)}`,
          historyPills: history,
          actualBlastTarget: target,
          ruleExplanation: `Geometric sequence: past flights multiply by ${ratio.toFixed(2)} each time, arriving at ${target.toFixed(2)}x!`,
          isInstantStall: false,
        };
      },
      () => {
        const lowVal = Number((1.8 + Math.random() * 1.2).toFixed(2));
        const highVal = Number((5.5 + Math.random() * 3.0).toFixed(2));
        const history = [lowVal, highVal, lowVal, highVal];
        const target = lowVal;
        return {
          name: 'Alternating Oscillation Cycle',
          description: `Blasts alternate between a low value (~${lowVal}x) and high value (~${highVal}x)`,
          historyPills: history,
          actualBlastTarget: target,
          ruleExplanation: `Alternating pattern: ${lowVal} -> ${highVal} -> ${lowVal} -> ${highVal}. Cycle predicts next blast at ${target.toFixed(2)}x!`,
          isInstantStall: false,
        };
      },
      () => {
        const base = 1.5;
        const history = [base, base + 1.0, base + 2.5, base + 4.5];
        const target = Number((base + 7.0).toFixed(2));
        return {
          name: 'Accelerating Gap (+1.0x, +1.5x, +2.0x...)',
          description: 'The difference between each flight increases by +0.50x',
          historyPills: history,
          actualBlastTarget: target,
          ruleExplanation: `Differences are +1.0, +1.5, +2.0. Next step increases by +2.5x, giving ${target.toFixed(2)}x!`,
          isInstantStall: false,
        };
      },
    ];

    const chosen = patternArchetypes[Math.floor(Math.random() * patternArchetypes.length)]();
    return chosen;
  }, [trialsSinceInstantStall]);

  // Multi-stage accelerating flight curve
  // 0-3s: +0.1 to +0.2x/s, 3-6s: +1.8x/s, 6-9s: +11-12x/s, >12s: +105-110x/s!
  const calculateAcceleratingMultiplier = (elapsedSec: number, isInstant: boolean, targetStall: number): number => {
    if (isInstant) {
      const progress = Math.min(1, elapsedSec / 0.25);
      return Number((1.0 + (targetStall - 1.0) * progress).toFixed(2));
    }

    let mult = 1.0;
    if (elapsedSec < 3.0) {
      mult = 1.0 + elapsedSec * 0.22;
    } else if (elapsedSec < 6.0) {
      const extra = elapsedSec - 3.0;
      mult = 1.66 + extra * 1.8 + Math.pow(extra, 1.6) * 0.4;
    } else if (elapsedSec < 9.0) {
      const extra = elapsedSec - 6.0;
      mult = 8.5 + extra * 11.2 + Math.pow(extra, 2.0) * 1.2;
    } else if (elapsedSec < 12.0) {
      const extra = elapsedSec - 9.0;
      mult = 45.0 + extra * 38.0 + Math.pow(extra, 2.2) * 3.5;
    } else {
      const extra = elapsedSec - 12.0;
      mult = 160.0 + extra * 105.0 + Math.pow(extra, 2.4) * 6.0;
    }

    return Number(mult.toFixed(2));
  };

  // --- START 5-SECOND PATTERN MEMORY WINDOW ---
  const startPatternCountdown = useCallback((targetPattern?: PatternSequence) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    sounds.stopJetEngine();

    const p = targetPattern || activePattern;
    setPhase('deduction');
    setPatternSecondsLeft(5.0);
    setCurrentMultiplier(1.0);
    currentMultiplierRef.current = 1.0;
    setStoppedMultiplier(null);
    setWasBlastedBeforeStop(false);
    setRoundAccuracy(null);
    setRoundPoints(0);
    setPerformanceRating(null);
    setLastRoundPlacement(null);
    setScreenShake(false);

    requestAnimationFrame(() => {
      renderStudyCanvas(1.0, false);
    });

    const startTimestamp = Date.now();
    let lastWholeSec = 5;

    countdownIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimestamp) / 1000;
      const remaining = Math.max(0, 5.0 - elapsed);
      setPatternSecondsLeft(Number(remaining.toFixed(1)));

      const wholeSec = Math.ceil(remaining);
      if (wholeSec <= 3 && wholeSec > 0 && wholeSec !== lastWholeSec) {
        lastWholeSec = wholeSec;
        sounds.playCountdownBlip(false);
      }

      if (remaining <= 0) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        sounds.playCountdownBlip(true);
        handleTakeoff(p);
      }
    }, 50);
  }, [activePattern]);

  // --- LAUNCH FLIGHT: PATTERN IS HIDDEN & PLANE FLIES OFF ---
  const handleTakeoff = (p?: PatternSequence) => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    const flightPattern = p || activePattern;

    sounds.playTap();
    setPhase('running');
    setCurrentMultiplier(1.0);
    currentMultiplierRef.current = 1.0;
    flightStartTimeRef.current = performance.now();
    sounds.startJetEngine();

    runFlightLoop(flightPattern.actualBlastTarget, flightPattern.isInstantStall);
  };

  // --- 60FPS HIGH-EFFICIENCY FLIGHT SIMULATION LOOP ---
  const runFlightLoop = (targetStall: number, isInstant: boolean) => {
    const loop = (timestamp: number) => {
      const elapsedMs = timestamp - flightStartTimeRef.current;
      const elapsedSec = elapsedMs / 1000;

      const calculatedMult = calculateAcceleratingMultiplier(elapsedSec, isInstant, targetStall);
      currentMultiplierRef.current = calculatedMult;

      // Direct DOM update avoids React re-renders, preventing UI freeze / layout jitter
      if (multiplierTextRef.current) {
        multiplierTextRef.current.textContent = `${calculatedMult.toFixed(2)}x`;
        const col = getMultiplierColor(calculatedMult);
        multiplierTextRef.current.style.color = col;
        multiplierTextRef.current.style.textShadow = `0 0 35px ${col}88`;
      }

      sounds.updateJetEngine(calculatedMult);

      // Plane dies/blasts accordingly to the pattern shown
      if (calculatedMult >= targetStall) {
        handleBlastOccurred(targetStall, isInstant);
        return;
      }

      renderStudyCanvas(calculatedMult, false);
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
  };

  // --- MANUAL USER STOP: CALCULATES EXACT STOPPING ACCURACY ---
  const handleStopFlight = () => {
    if (phase !== 'running') return;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const stoppedAt = currentMultiplierRef.current;
    const blastedAt = activePattern.actualBlastTarget;

    sounds.playCashoutDing();
    sounds.stopJetEngine();

    setPhase('revealed');
    setCurrentMultiplier(stoppedAt);
    setStoppedMultiplier(stoppedAt);
    setWasBlastedBeforeStop(false);

    // Stopping Accuracy %: (stopped / blast) * 100
    const rawAccuracy = Math.max(0, Math.min(100, (stoppedAt / blastedAt) * 100));
    const acc = Number(rawAccuracy.toFixed(2));
    setRoundAccuracy(acc);

    const diff = Number((blastedAt - stoppedAt).toFixed(2));
    const pts = Math.round(acc * 10 + stoppedAt * 15);
    setRoundPoints(pts);

    let rating = { title: 'Safe Ejection (Good Precision)', color: '#FFFFFF', bg: '#2980B9' };
    if (acc >= 96.0) {
      rating = { title: `🎯 CRACKED PATTERN WITH PINPOINT ACCURACY! (${acc}% - Only ${diff}x from death!)`, color: '#FFFFFF', bg: '#27AE60' };
    } else if (acc >= 85.0) {
      rating = { title: `⚡ HIGH PRECISION! (${acc}% Accuracy - Excellent timing)`, color: '#FFFFFF', bg: '#F39C12' };
    } else if (acc >= 70.0) {
      rating = { title: `📐 SOLID APITUDE CALIBRATION (${acc}% Accuracy)`, color: '#FFFFFF', bg: '#3498DB' };
    } else {
      rating = { title: `⚠️ EARLY STOP (${acc}% Accuracy - Stopped too early)`, color: '#FFFFFF', bg: '#E67E22' };
    }
    setPerformanceRating(rating);

    if (acc >= 85.0) {
      confetti({
        particleCount: acc >= 95 ? 85 : 45,
        spread: 75,
        origin: { y: 0.65 },
      });
    }

    saveToAccuracyLeaderboard(acc, stoppedAt, blastedAt, diff, pts, activePattern.name);
  };

  // --- PLANE DIES BEFORE STOPPED ---
  const handleBlastOccurred = (blastedAt: number, isInstant: boolean) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    sounds.playCrashExplosion();
    sounds.stopJetEngine();

    setPhase('revealed');
    setCurrentMultiplier(blastedAt);
    currentMultiplierRef.current = blastedAt;
    setStoppedMultiplier(blastedAt);
    setWasBlastedBeforeStop(true);
    setRoundAccuracy(0);
    setRoundPoints(0);
    setScreenShake(true);

    let rating = { title: '💥 PLANE DROWNED & DIED! (0% Accuracy - Overshot pattern target)', color: '#FFFFFF', bg: '#C0392B' };
    if (isInstant) {
      rating = { title: '⚡ SUDDEN STALL ANOMALY! (Early death outlier)', color: '#FFFFFF', bg: '#E74C3C' };
    }
    setPerformanceRating(rating);

    createStallParticles(blastedAt);

    let stallFrames = 0;
    const animateStall = () => {
      renderStudyCanvas(blastedAt, true);
      stallFrames++;
      if (stallFrames < 50) {
        requestAnimationFrame(animateStall);
      }
    };
    requestAnimationFrame(animateStall);

    setTimeout(() => {
      setScreenShake(false);
    }, 450);
  };

  // --- SAVE TO ACCURACY TOP 5 LEADERBOARD ---
  const saveToAccuracyLeaderboard = (
    acc: number,
    stopped: number,
    blast: number,
    diff: number,
    pts: number,
    ruleName: string
  ) => {
    const activeName = playerName.trim() || 'Anonymous Analyst';
    const entryId = Date.now().toString();
    const entry: AeroAccuracyLeaderboardEntry = {
      id: entryId,
      name: activeName,
      accuracy: acc,
      stoppedMultiplier: stopped,
      blastMultiplier: blast,
      diffMultiplier: diff,
      patternRule: ruleName,
      pts: pts,
      dateStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setLeaderboard((prev) => {
      const combined = [...prev, entry].sort((a, b) => b.accuracy - a.accuracy);
      const top5 = combined.slice(0, 5);
      const placementIndex = top5.findIndex((item) => item.id === entryId);

      if (placementIndex !== -1) {
        setLastRoundPlacement(placementIndex + 1);
        setHighlightedEntryId(entryId);
        sounds.playVictory();
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(top5));
      } catch (e) {
        console.error('Failed to save accuracy leaderboard', e);
      }
      return top5;
    });
  };

  // --- NEXT FLIGHT CHALLENGE: GENERATE BRAND NEW RANDOM PATTERN ---
  const handleNextFlightChallenge = () => {
    sounds.playTap();
    const nextP = generateNewPatternPuzzle();
    setActivePattern(nextP);
    startPatternCountdown(nextP);
  };

  // --- NAME SUBMISSION ---
  const handleConfirmStudentName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = nameInputValue.trim();
    if (!trimmed) {
      setNameModalError('Please enter runner name!');
      return;
    }

    setNameModalError(null);
    setPlayerName(trimmed);
    try {
      localStorage.setItem(NAME_STORAGE_KEY, trimmed);
    } catch (err) {
      console.error('Failed to save name', err);
    }

    setIsNameModalOpen(false);
    sounds.playTap();

    // Directly present the 5-second pattern countdown upon entering name!
    startPatternCountdown();
  };

  // Initial mount: if name exists, start pattern countdown
  useEffect(() => {
    const p = generateNewPatternPuzzle();
    setActivePattern(p);
    if (playerName.trim()) {
      startPatternCountdown(p);
    }
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      sounds.stopJetEngine();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const handleClearLeaderboard = () => {
    sounds.playTap();
    if (window.confirm('Reset Top 5 Accuracy Leaderboard?')) {
      setLeaderboard([]);
      setHighlightedEntryId(null);
      setLastRoundPlacement(null);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.error('Failed to clear leaderboard', e);
      }
    }
  };

  const createStallParticles = (mult: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;

    const flightProgress = Math.min(1.0, (Math.log2(Math.max(1, mult)) + 0.15) / 5.5);
    const planeX = 60 + flightProgress * (w - 180);
    const planeY = h - 60 - Math.pow(flightProgress, 0.85) * (h - 150);

    const particles = [];
    const colors = ['#E74C3C', '#F39C12', '#3498DB', '#FFFFFF'];
    for (let i = 0; i < 48; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      particles.push({
        x: planeX,
        y: planeY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        size: Math.random() * 3.5 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    stallParticles.current = particles;
  };

  // --- STUDY LABORATORY CANVAS RENDERER ---
  const renderStudyCanvas = (mult: number, isStalled: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#0E1726');
    bgGrad.addColorStop(1, '#1A293E');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Blueprint graph grid lines
    ctx.strokeStyle = 'rgba(74, 144, 226, 0.08)';
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Floating formulas
    mathSymbols.current.forEach((sym) => {
      sym.x -= sym.speed;
      if (sym.x < -120) sym.x = w + 50;
      ctx.fillStyle = `rgba(147, 197, 253, ${sym.alpha})`;
      ctx.font = `${sym.size}px "Courier New", monospace`;
      ctx.fillText(sym.text, sym.x, sym.y);
    });

    // Aerodynamic streamlines
    airflowStreams.current.forEach((stream) => {
      stream.y += (Math.random() - 0.5) * 0.4;
      const speedMult = 1 + (mult > 2 ? Math.min(5, mult * 0.25) : 0);
      const startStreamX = (performance.now() * 0.15 * stream.speed * speedMult) % (w + 200) - 100;
      const xPos = w - startStreamX;

      ctx.strokeStyle = `rgba(56, 176, 125, ${stream.alpha})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(xPos, stream.y);
      ctx.lineTo(xPos + stream.length, stream.y);
      ctx.stroke();
    });

    const startX = 60;
    const startY = h - 60;

    const flightProgress = Math.min(1.0, (Math.log2(Math.max(1, mult)) + 0.15) / 5.5);
    const planeX = startX + flightProgress * (w - 180);
    const planeY = startY - Math.pow(flightProgress, 0.85) * (h - 150);

    const controlX = startX + (planeX - startX) * 0.55;
    const controlY = startY;

    if (!isStalled) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(controlX, controlY, planeX, planeY);
      ctx.lineTo(planeX, startY);
      ctx.closePath();

      const areaGrad = ctx.createLinearGradient(0, planeY, 0, startY);
      areaGrad.addColorStop(0, mult >= 10 ? 'rgba(243, 156, 18, 0.28)' : 'rgba(56, 176, 125, 0.25)');
      areaGrad.addColorStop(1, 'rgba(0, 0, 0, 0.01)');
      ctx.fillStyle = areaGrad;
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.shadowColor = mult >= 10 ? '#F39C12' : '#38B07D';
      ctx.shadowBlur = 12;
      ctx.strokeStyle = mult >= 10 ? '#F39C12' : '#38B07D';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(controlX, controlY, planeX, planeY);
      ctx.stroke();
      ctx.restore();

      if (Math.random() < 0.8) {
        exhaustParticles.current.push({
          x: planeX - 14,
          y: planeY + 6,
          vx: -(Math.random() * 3 + 2),
          vy: Math.random() * 1.5 - 0.75,
          life: 1.0,
          size: Math.random() * 4 + 2,
          color: mult >= 10 ? '#F39C12' : '#38B07D',
        });
      }

      exhaustParticles.current.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
        if (p.life <= 0) {
          exhaustParticles.current.splice(idx, 1);
          return;
        }
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life * 0.7;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      const t = 0.98;
      const prevX = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * controlX + t * t * planeX;
      const prevY = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * controlY + t * t * planeY;
      const angle = Math.atan2(planeY - prevY, planeX - prevX);

      drawResearchJet(ctx, planeX, planeY, angle, mult >= 10);
    } else {
      stallParticles.current.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.03;
        if (p.life <= 0) {
          stallParticles.current.splice(idx, 1);
          return;
        }
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, startY);
    ctx.lineTo(w - 30, startY);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '11px monospace';
    ctx.fillText('VELOCITY: ' + Math.round(mult * 280) + ' km/h', 46, 38);
    ctx.fillText('RATE: ' + (mult < 2 ? '+0.2x/s' : mult < 10 ? '+2.5x/s' : mult < 50 ? '+12x/s' : '+110x/s!'), 46, 54);
  };

  const drawResearchJet = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    isSupercharged: boolean
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const flameLength = 16 + Math.random() * 8;
    const flameGrad = ctx.createLinearGradient(-10, 0, -10 - flameLength, 0);
    flameGrad.addColorStop(0, '#FFFFFF');
    flameGrad.addColorStop(0.5, isSupercharged ? '#F39C12' : '#38B07D');
    flameGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.moveTo(-8, -3);
    ctx.lineTo(-8 - flameLength, 0);
    ctx.lineTo(-8, 3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = isSupercharged ? '#D35400' : '#2980B9';
    ctx.beginPath();
    ctx.moveTo(-3, -16);
    ctx.lineTo(7, -3);
    ctx.lineTo(7, 3);
    ctx.lineTo(-3, 16);
    ctx.lineTo(-5, 7);
    ctx.lineTo(-10, 0);
    ctx.lineTo(-5, -7);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = isSupercharged ? '#F39C12' : '#3498DB';
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-12, 0);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(3, 0, 6, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const getMultiplierColor = (m: number) => {
    if (m < 1.2) return '#E74C3C';
    if (m < 2.0) return '#3498DB';
    if (m < 10.0) return '#38B07D';
    if (m < 50.0) return '#F39C12';
    return '#E056FD';
  };

  const playerTopRank = leaderboard.findIndex(
    (item) => item.name.toLowerCase() === playerName.toLowerCase().trim()
  ) + 1;
  const playerBest = leaderboard.find(
    (item) => item.name.toLowerCase() === playerName.toLowerCase().trim()
  );

  return (
    <div
      style={{
        maxWidth: '1280px',
        width: '100%',
        margin: '0 auto',
        padding: '12px 20px',
        minHeight: '94vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Bar Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 22px',
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
              sounds.stopJetEngine();
              onBack();
            }}
            className="btn-squishy btn-outline"
            style={{ padding: '8px 18px', fontSize: '1rem', color: '#2C3E50', backgroundColor: '#FFFFFF' }}
            title="Back to Game Map"
          >
            <ArrowLeft size={18} style={{ marginRight: '6px' }} />
            Map
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: phase === 'running' ? '#E74C3C' : '#38B07D',
                  boxShadow: phase === 'running' ? '0 0 10px #E74C3C' : '0 0 8px #38B07D',
                }}
              />
              <h1 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#2C3E50', margin: 0, letterSpacing: '-0.5px' }}>
                Aero Velocity: Flight Stopwatch
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#7F8C8D', fontWeight: 700 }}>
              Analytical Aptitude &bull; 5s Pattern Memory &bull; Precision Ejection
            </p>
          </div>
        </div>

        {/* Runner Pill, Sound & Guide */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => {
              sounds.playTap();
              setNameInputValue(playerName);
              setIsNameModalOpen(true);
            }}
            className="btn-squishy"
            style={{
              padding: '8px 14px',
              backgroundColor: '#F8FAF9',
              border: '2px solid #38B07D',
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 800,
              color: '#2C3E50',
            }}
            title="Click to edit runner name"
          >
            <User size={16} color="#38B07D" />
            <span>{playerName || 'Set Name'}</span>
          </button>

          <button
            onClick={() => {
              sounds.playTap();
              setIsGuideOpen(true);
            }}
            className="btn-squishy btn-outline"
            style={{ padding: '8px 12px', backgroundColor: '#FFFFFF', color: '#2C3E50' }}
            title="How to Play"
          >
            <HelpCircle size={18} color="#3498DB" />
          </button>

          <button
            onClick={handleToggleSound}
            className="btn-squishy btn-outline"
            style={{ padding: '8px', borderRadius: '50%', minWidth: '40px', height: '40px', backgroundColor: '#FFFFFF' }}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX size={18} color="#7F8C8D" /> : <Volume2 size={18} color="#38B07D" />}
          </button>
        </div>
      </header>

      {/* Main Split-Screen Container */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.35fr) minmax(340px, 1fr)',
          gap: '20px',
          alignItems: 'start',
          flex: 1,
        }}
        className="aero-split-grid"
      >
        {/* ================= LEFT SIDE: STUDY FLIGHT STAGE & CONTROLS ================= */}
        <div
          className="toy-card"
          style={{
            padding: '20px 24px',
            backgroundColor: '#FFFFFF',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            borderRadius: '24px',
          }}
        >
          {/* ================= FIXED-HEIGHT BANNER CONTAINER (NO LAYOUT JUMPS) ================= */}
          <div style={{ minHeight: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {/* PHASE 1: PATTERN STUDY WINDOW (5s COUNTDOWN) */}
            {phase === 'deduction' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  background: 'linear-gradient(135deg, #FAF7F2 0%, #F0FBF6 100%)',
                  border: '2.5px solid #38B07D',
                  borderRadius: '20px',
                  padding: '14px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Timer size={20} color="#E67E22" />
                    <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#2C3E50', textTransform: 'uppercase' }}>
                      Memorize Pattern! Hiding in{' '}
                      <span style={{ color: '#E74C3C', fontFamily: 'monospace', fontSize: '1.15rem' }}>
                        {patternSecondsLeft.toFixed(1)}s
                      </span>
                    </span>
                  </div>

                  {/* 5-second progress bar & instant skip button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '120px', height: '10px', backgroundColor: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${(patternSecondsLeft / 5.0) * 100}%`,
                          backgroundColor: patternSecondsLeft <= 2 ? '#E74C3C' : '#38B07D',
                          transition: 'width 0.05s linear',
                        }}
                      />
                    </div>

                    <button
                      onClick={() => handleTakeoff()}
                      className="btn-squishy btn-sun"
                      style={{ padding: '5px 14px', fontSize: '0.8rem', fontWeight: 800, borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      title="Skip 5s and fly immediately"
                    >
                      <Play size={12} fill="#FFFFFF" />
                      <span>Fly Now</span>
                    </button>
                  </div>
                </div>

                {/* Past 4-5 Blast Pills */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {activePattern.historyPills.map((blastVal, idx) => (
                    <React.Fragment key={idx}>
                      <div
                        style={{
                          padding: '6px 14px',
                          borderRadius: '12px',
                          backgroundColor: '#FFFFFF',
                          border: '2px solid #38B07D',
                          boxShadow: '0 3px 8px rgba(56, 176, 125, 0.15)',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: '0.62rem', color: '#7F8C8D', fontWeight: 800, textTransform: 'uppercase' }}>
                          Flight #{idx + 1}
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#2C3E50' }}>
                          {blastVal.toFixed(2)}x
                        </div>
                      </div>
                      {idx < activePattern.historyPills.length - 1 && (
                        <span style={{ color: '#38B07D', fontSize: '1.1rem', fontWeight: 900 }}>➔</span>
                      )}
                    </React.Fragment>
                  ))}

                  <span style={{ color: '#E74C3C', fontSize: '1.1rem', fontWeight: 900 }}>➔</span>

                  {/* Mystery Next Flight Pill */}
                  <div
                    style={{
                      padding: '6px 14px',
                      borderRadius: '12px',
                      backgroundColor: '#FFEAEA',
                      border: '2px dashed #E74C3C',
                      boxShadow: '0 3px 10px rgba(231, 76, 60, 0.2)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '0.62rem', color: '#D44242', fontWeight: 800, textTransform: 'uppercase' }}>
                      Flight #{activePattern.historyPills.length + 1} (Dies At?)
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#E74C3C' }}>
                      ???
                    </div>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 700, marginLeft: 'auto' }}>
                    💡 <strong>Hint:</strong> {activePattern.description}
                  </div>
                </div>
              </motion.div>
            )}

            {/* PHASE 2: PATTERN HIDDEN DURING FLIGHT */}
            {phase === 'running' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  backgroundColor: '#0F172A',
                  border: '2px solid #334155',
                  borderRadius: '20px',
                  padding: '16px 22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: '#FFFFFF',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <EyeOff size={24} color="#F39C12" />
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#F39C12', letterSpacing: '0.5px' }}>
                      PATTERN HIDDEN &bull; SUPERSONIC JET FLYING OFF!
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#94A3B8', fontWeight: 700, marginTop: '2px' }}>
                      The jet will die at the exact pattern target! Stop before it dies!
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: '#1E293B',
                    padding: '8px 16px',
                    borderRadius: '999px',
                    fontSize: '0.84rem',
                    fontWeight: 900,
                    color: '#38B07D',
                    border: '1px solid #38B07D66',
                  }}
                >
                  Pattern Hidden for Aptitude Test
                </div>
              </motion.div>
            )}

            {/* PHASE 3: REVEALED FLIGHT SUMMARY */}
            {phase === 'revealed' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  backgroundColor: '#F8FAF9',
                  border: '2px solid #CBD5E1',
                  borderRadius: '20px',
                  padding: '14px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
                  <div style={{ backgroundColor: '#FFFFFF', padding: '8px 12px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>You Stopped</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: wasBlastedBeforeStop ? '#E74C3C' : '#2ECC71' }}>
                      {wasBlastedBeforeStop ? 'Drowned/Died' : `${stoppedMultiplier?.toFixed(2)}x`}
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#FFFFFF', padding: '8px 12px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Pattern Death Target</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#E74C3C' }}>
                      {activePattern.actualBlastTarget.toFixed(2)}x
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#FFFFFF', padding: '8px 12px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Stopping Accuracy</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: wasBlastedBeforeStop ? '#E74C3C' : '#27AE60' }}>
                      {wasBlastedBeforeStop ? '0.00%' : `${roundAccuracy?.toFixed(2)}%`}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 700, textAlign: 'center' }}>
                  📖 <strong>Pattern Rule Revealed:</strong> {activePattern.ruleExplanation}
                </div>
              </motion.div>
            )}
          </div>

          {/* Animated Flight Canvas Stage */}
          <div
            style={{
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              backgroundColor: '#0E1726',
              border: '2px solid #1E293B',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              transform: screenShake ? 'translate(2px, -3px) rotate(0.4deg)' : 'none',
              transition: 'transform 0.05s ease',
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: '340px',
                display: 'block',
              }}
            />

            {/* Center Multiplier HUD */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              {phase === 'deduction' && (
                <div>
                  <div style={{ fontSize: '4.2rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '3px', fontFamily: 'monospace', lineHeight: 1.1 }}>
                    1.00x
                  </div>
                  <div style={{ color: '#CBD5E1', fontSize: '0.95rem', fontWeight: 700, marginTop: '8px' }}>
                    Memorize pattern above! Launching in {patternSecondsLeft.toFixed(1)}s...
                  </div>
                </div>
              )}

              {phase === 'running' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div
                    ref={multiplierTextRef}
                    style={{
                      fontSize: '4.8rem',
                      fontWeight: 900,
                      color: '#FFFFFF',
                      lineHeight: 1,
                      fontFamily: 'monospace',
                      textShadow: '0 0 35px rgba(56, 176, 125, 0.8)',
                    }}
                  >
                    1.00x
                  </div>
                  <div
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      color: '#38B07D',
                      letterSpacing: '2px',
                      marginTop: '6px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Runner: <strong>{playerName}</strong> &bull; Eject before it dies!
                  </div>
                </div>
              )}

              {phase === 'revealed' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#BDC3C7', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {wasBlastedBeforeStop ? 'Plane Drowned & Died' : `${playerName}'s Stopping Accuracy`}
                  </div>

                  <div
                    style={{
                      fontSize: '4.6rem',
                      fontWeight: 900,
                      color: wasBlastedBeforeStop ? '#E74C3C' : '#2ECC71',
                      lineHeight: 1,
                      fontFamily: 'monospace',
                      textShadow: wasBlastedBeforeStop
                        ? '0 0 35px rgba(231, 76, 60, 0.8)'
                        : '0 0 35px rgba(46, 204, 113, 0.8)',
                    }}
                  >
                    {wasBlastedBeforeStop ? '0.00%' : `${roundAccuracy?.toFixed(2)}%`}
                  </div>

                  <div
                    style={{
                      display: 'inline-block',
                      marginTop: '6px',
                      padding: '5px 18px',
                      borderRadius: '999px',
                      backgroundColor: wasBlastedBeforeStop ? '#C0392B' : '#27AE60',
                      color: '#FFFFFF',
                      fontSize: '1rem',
                      fontWeight: 900,
                    }}
                  >
                    {wasBlastedBeforeStop
                      ? `Died @ ${activePattern.actualBlastTarget.toFixed(2)}x (0 PTS)`
                      : `Stopped @ ${stoppedMultiplier?.toFixed(2)}x | Blast was @ ${activePattern.actualBlastTarget.toFixed(2)}x (+${roundPoints} PTS)`}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rating Badge & Placement Notice */}
          <AnimatePresence>
            {phase === 'revealed' && performanceRating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '8px 20px',
                  borderRadius: '16px',
                  backgroundColor: performanceRating.bg,
                  color: performanceRating.color,
                  fontWeight: 900,
                  fontSize: '1.05rem',
                  display: 'inline-block',
                  margin: '0 auto',
                  textAlign: 'center',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                }}
              >
                {performanceRating.title}
              </motion.div>
            )}
            {phase === 'revealed' && lastRoundPlacement && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  padding: '6px 18px',
                  borderRadius: '12px',
                  backgroundColor: '#FEF3C7',
                  border: '1.5px solid #F59E0B',
                  color: '#92400E',
                  fontWeight: 900,
                  fontSize: '0.92rem',
                  display: 'inline-block',
                  margin: '0 auto',
                  textAlign: 'center',
                }}
              >
                🏆 Outstanding! You earned #{lastRoundPlacement} on the Top 5 Accuracy Leaderboard!
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Control Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
            {phase === 'deduction' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTakeoff()}
                className="btn-squishy btn-forest"
                style={{
                  padding: '14px 48px',
                  fontSize: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 8px 24px rgba(46, 204, 113, 0.45)',
                  borderRadius: '999px',
                }}
              >
                <Play size={22} fill="#FFFFFF" />
                <span>TAKE OFF NOW ({patternSecondsLeft.toFixed(1)}s)</span>
              </motion.button>
            )}

            {phase === 'running' && (
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={handleStopFlight}
                className="btn-squishy"
                style={{
                  padding: '16px 64px',
                  fontSize: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: '#E74C3C',
                  color: '#FFFFFF',
                  boxShadow: '0 10px 30px rgba(231, 76, 60, 0.55)',
                  borderRadius: '999px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 900,
                }}
              >
                <Square size={26} fill="#FFFFFF" />
                <span>STOP NOW!</span>
              </motion.button>
            )}

            {phase === 'revealed' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNextFlightChallenge}
                  className="btn-squishy btn-sun"
                  style={{
                    padding: '12px 28px',
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#38B07D',
                    borderColor: '#248259',
                    color: '#FFFFFF',
                  }}
                >
                  <RotateCcw size={20} />
                  <span>Next Flight Challenge (5s Pattern)</span>
                </motion.button>

                <button
                  onClick={() => {
                    sounds.playTap();
                    onBack();
                  }}
                  className="btn-squishy btn-outline"
                  style={{ padding: '12px 22px', fontSize: '1.05rem', backgroundColor: '#FFFFFF', color: '#2C3E50' }}
                >
                  Back to Map
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT SIDE: TOP 5 ACCURACY LEADERBOARD ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              borderRadius: '24px',
            }}
          >
            {/* Leaderboard Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '12px',
                borderBottom: '2px solid #F4EFE6',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    backgroundColor: '#FEF9E7',
                    border: '2px solid #F4D03F',
                    borderRadius: '12px',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trophy size={22} color="#D4AC0D" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#2C3E50' }}>
                      Top 5 Accuracy Board
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#8A6D3B', fontWeight: 800 }}>
                    Highest Ejection Proximity to Blast Point
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
              <div>
                {playerTopRank > 0 ? (
                  <span style={{ color: '#27AE60', backgroundColor: '#E8F8F0', padding: '2px 8px', borderRadius: '999px' }}>
                    Rank #{playerTopRank} ({playerBest?.accuracy}% Acc)
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
                    padding: '34px 18px',
                    textAlign: 'center',
                    backgroundColor: '#FDFBF7',
                    borderRadius: '20px',
                    border: '2px dashed #E2D9CC',
                  }}
                >
                  <div style={{ fontSize: '2.6rem', marginBottom: '8px' }}>🎯</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#2C3E50' }}>
                    The Accuracy Podium is Empty!
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#7F8C8D', fontWeight: 700, marginTop: '6px' }}>
                    Crack the past 4-5 flights pattern and stop right before the blast to enter the Top 5!
                  </div>
                </div>
              ) : (
                leaderboard.map((entry, idx) => {
                  const isHighlighted = entry.id === highlightedEntryId;
                  const isCurrentPlayer = entry.name.toLowerCase() === playerName.toLowerCase().trim();

                  let medal = `${idx + 1}`;
                  let rankBg = '#EDF2F7';
                  let rankColor = '#4A5568';

                  if (idx === 0) {
                    medal = '🥇';
                    rankBg = '#FEF9E7';
                    rankColor = '#B7950B';
                  } else if (idx === 1) {
                    medal = '🥈';
                    rankBg = '#F2F4F4';
                    rankColor = '#7F8C8D';
                  } else if (idx === 2) {
                    medal = '🥉';
                    rankBg = '#FBEEE6';
                    rankColor = '#BA4A00';
                  }

                  return (
                    <motion.div
                      key={entry.id}
                      initial={isHighlighted ? { scale: 0.95, opacity: 0 } : false}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: '16px',
                        backgroundColor: isHighlighted ? '#E8F8F0' : isCurrentPlayer ? '#F0F9FF' : '#FAF8F5',
                        border: isHighlighted
                          ? '2px solid #2ECC71'
                          : isCurrentPlayer
                          ? '2px solid #BAE6FD'
                          : '1px solid #EBE5DB',
                        boxShadow: isHighlighted ? '0 4px 14px rgba(46, 204, 113, 0.25)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '10px',
                            backgroundColor: rankBg,
                            color: rankColor,
                            fontWeight: 900,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: idx < 3 ? '1.25rem' : '0.95rem',
                          }}
                        >
                          {medal}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#2C3E50' }}>
                              {entry.name}
                            </span>
                            {isCurrentPlayer && (
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 900,
                                  backgroundColor: '#38B07D',
                                  color: '#FFFFFF',
                                  padding: '1px 6px',
                                  borderRadius: '999px',
                                }}
                              >
                                YOU
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#7F8C8D', fontWeight: 700 }}>
                            {entry.patternRule} &bull; Stopped @ {entry.stoppedMultiplier.toFixed(2)}x / {entry.blastMultiplier.toFixed(2)}x
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#27AE60', fontFamily: 'monospace' }}>
                          {entry.accuracy.toFixed(2)}%
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#8A6D3B', fontWeight: 800 }}>
                          +{entry.pts} PTS
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* Educational Aptitude Card */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '20px',
              backgroundColor: '#F0F9FF',
              border: '2px solid #BAE6FD',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={18} color="#0284C7" />
              <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0369A1' }}>
                Aptitude Study Insights
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#334155', lineHeight: 1.5, fontWeight: 600 }}>
              This challenge develops numerical sequence extrapolation and impulse timing.
              Memorize the past 4-5 flights during the 5-second window, determine the pattern step,
              and eject milliseconds before the flight reaches its termination threshold!
            </p>
          </div>
        </div>
      </div>

      {/* ================= NAME ENTRY MODAL (FIRST TIME / EDIT) ================= */}
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
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(8px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                width: '100%',
                maxWidth: '460px',
                backgroundColor: '#FFFFFF',
                borderRadius: '28px',
                padding: '30px 28px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
                border: '3px solid #38B07D',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '20px',
                  backgroundColor: '#E8F8F0',
                  color: '#38B07D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                  border: '2px solid #38B07D',
                }}
              >
                <UserCheck size={32} />
              </div>

              <h2 style={{ fontSize: '1.55rem', fontWeight: 900, color: '#2C3E50', margin: '0 0 6px 0' }}>
                Welcome, Flight Analyst!
              </h2>
              <p style={{ fontSize: '0.88rem', color: '#64748B', fontWeight: 600, margin: '0 0 20px 0', lineHeight: 1.4 }}>
                Please enter your name. Once confirmed, a pattern of past flights will appear for <strong>5 seconds</strong> to memorize before takeoff!
              </p>

              <form onSubmit={handleConfirmStudentName}>
                <div style={{ marginBottom: '16px' }}>
                  <input
                    ref={modalInputRef}
                    type="text"
                    placeholder="e.g. Advait, Sarah, Captain Ryan"
                    value={nameInputValue}
                    onChange={(e) => {
                      setNameInputValue(e.target.value);
                      if (nameModalError) setNameModalError(null);
                    }}
                    maxLength={22}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      borderRadius: '14px',
                      border: nameModalError ? '2px solid #E74C3C' : '2px solid #CBD5E1',
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      color: '#2C3E50',
                      outline: 'none',
                      boxSizing: 'border-box',
                      textAlign: 'center',
                    }}
                  />
                  {nameModalError && (
                    <div style={{ color: '#E74C3C', fontSize: '0.8rem', fontWeight: 800, marginTop: '6px' }}>
                      {nameModalError}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn-squishy btn-forest"
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '1.15rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    borderRadius: '16px',
                  }}
                >
                  <Sparkles size={20} />
                  <span>Confirm &amp; Start Flight</span>
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= HOW TO PLAY GUIDE MODAL ================= */}
      <AnimatePresence>
        {isGuideOpen && (
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
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(8px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                width: '100%',
                maxWidth: '520px',
                backgroundColor: '#FFFFFF',
                borderRadius: '26px',
                padding: '26px 28px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                border: '3px solid #3498DB',
              }}
            >
              <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#2C3E50', margin: '0 0 14px 0' }}>
                How to Play: Aero Velocity
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem', color: '#475569', lineHeight: 1.5 }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ fontWeight: 900, color: '#38B07D', fontSize: '1.1rem' }}>1.</div>
                  <div>
                    <strong>5-Second Pattern Inspection:</strong> As each round begins, the blasts of the past 4-5 flights are shown in sequence (e.g. +1.50x each time, geometric scaling, or cycles).
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ fontWeight: 900, color: '#E67E22', fontSize: '1.1rem' }}>2.</div>
                  <div>
                    <strong>Pattern Hides &amp; Flight Launches:</strong> After 5 seconds, the pattern is completely removed from view and the supersonic jet flies off!
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ fontWeight: 900, color: '#E74C3C', fontSize: '1.1rem' }}>3.</div>
                  <div>
                    <strong>Stop Before It Dies:</strong> The plane will die (blast) at the exact mathematical target deduced from the pattern. Click <strong>STOP NOW!</strong> right before it dies.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ fontWeight: 900, color: '#9B59B6', fontSize: '1.1rem' }}>4.</div>
                  <div>
                    <strong>Accuracy Scoring &amp; Leaderboard:</strong> Accuracy is calculated as <code>(Stopped / Blast) &times; 100</code>. Stopping right before the blast earns near 100% accuracy and ranks on the Top 5 Leaderboard!
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '22px', textAlign: 'center' }}>
                <button
                  onClick={() => {
                    sounds.playTap();
                    setIsGuideOpen(false);
                  }}
                  className="btn-squishy btn-forest"
                  style={{ padding: '10px 32px', fontSize: '1rem', borderRadius: '12px' }}
                >
                  Got It, Let&apos;s Fly!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
