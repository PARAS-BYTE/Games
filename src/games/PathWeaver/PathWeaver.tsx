import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameHeader } from '../../components/common/GameHeader';
import { GameCompletionModal } from '../../components/common/GameCompletionModal';
import { AdaptiveEngine } from '../../engine/AdaptiveEngine';
import type { GameMetrics } from '../../engine/types';
import { sounds } from '../../audio/soundEngine';

interface Point {
  x: number;
  y: number;
}

interface Obstacle {
  x: number;
  y: number;
  radius: number;
  baseY?: number;
  speed?: number;
  amplitude?: number;
}

interface TrailLevelConfig {
  name: string;
  themeTitle: string;
  bgTheme: string;
  dotColor: string;
  pathColor: string;
  glowColor: string;
  obsColor: string;
  obsAccent: string;
  obsShape: 'circle' | 'diamond' | 'shield' | 'star' | 'gear';
  start: Point;
  end: Point;
  checkpoints: Point[];
  obstacles: Obstacle[];
}

const TRAIL_LEVELS: TrailLevelConfig[] = [
  // Level 1: Ascending Meadow (Easy)
  {
    name: 'Ascending Meadow',
    themeTitle: 'Lush Grassland Trial',
    bgTheme: '#F2F9F4',
    dotColor: '#C8E6C9',
    pathColor: '#2ECC71',
    glowColor: 'rgba(46, 204, 113, 0.6)',
    obsColor: '#E67E22',
    obsAccent: '#D35400',
    obsShape: 'circle',
    start: { x: 80, y: 380 },
    end: { x: 770, y: 100 },
    checkpoints: [{ x: 425, y: 240 }],
    obstacles: [
      { x: 270, y: 210, radius: 26, baseY: 210, speed: 0.003, amplitude: 55 },
      { x: 580, y: 270, radius: 26, baseY: 270, speed: 0.003, amplitude: 55 },
    ],
  },
  // Level 2: Azure Trench (Easy)
  {
    name: 'Azure Trench',
    themeTitle: 'Deep Submarine Wave',
    bgTheme: '#EBF5FB',
    dotColor: '#AED6F1',
    pathColor: '#2980B9',
    glowColor: 'rgba(41, 128, 185, 0.6)',
    obsColor: '#8E44AD',
    obsAccent: '#5B2C6F',
    obsShape: 'diamond',
    start: { x: 80, y: 240 },
    end: { x: 770, y: 240 },
    checkpoints: [{ x: 280, y: 100 }, { x: 570, y: 380 }],
    obstacles: [
      { x: 210, y: 240, radius: 26, baseY: 240, speed: 0.0035, amplitude: 65 },
      { x: 425, y: 130, radius: 26, baseY: 130, speed: 0.0035, amplitude: 65 },
      { x: 640, y: 310, radius: 26, baseY: 310, speed: 0.0035, amplitude: 65 },
    ],
  },
  // Level 3: Sunset Canyon U-Turn (Medium)
  {
    name: 'Sunset Canyon',
    themeTitle: 'Terracotta Switchback',
    bgTheme: '#FDF2E9',
    dotColor: '#F5CBA7',
    pathColor: '#D35400',
    glowColor: 'rgba(211, 84, 0, 0.6)',
    obsColor: '#C0392B',
    obsAccent: '#922B21',
    obsShape: 'shield',
    start: { x: 90, y: 90 },
    end: { x: 90, y: 390 },
    checkpoints: [{ x: 400, y: 90 }, { x: 750, y: 240 }, { x: 400, y: 390 }],
    obstacles: [
      { x: 260, y: 240, radius: 28, baseY: 240, speed: 0 },
      { x: 530, y: 160, radius: 26, baseY: 160, speed: 0.004, amplitude: 70 },
      { x: 530, y: 320, radius: 26, baseY: 320, speed: 0.004, amplitude: 70 },
    ],
  },
  // Level 4: Neon Matrix Core (Medium)
  {
    name: 'Neon Matrix',
    themeTitle: 'Cybernetic Circuit Gate',
    bgTheme: '#F4ECF7',
    dotColor: '#D7BDE2',
    pathColor: '#8E44AD',
    glowColor: 'rgba(142, 68, 173, 0.6)',
    obsColor: '#E74C3C',
    obsAccent: '#B03A2E',
    obsShape: 'gear',
    start: { x: 80, y: 240 },
    end: { x: 770, y: 240 },
    checkpoints: [{ x: 230, y: 370 }, { x: 425, y: 100 }, { x: 620, y: 370 }],
    obstacles: [
      { x: 190, y: 130, radius: 25, baseY: 130, speed: 0.004, amplitude: 75 },
      { x: 340, y: 340, radius: 25, baseY: 340, speed: 0.0045, amplitude: 75 },
      { x: 510, y: 130, radius: 25, baseY: 130, speed: 0.004, amplitude: 75 },
      { x: 670, y: 330, radius: 25, baseY: 330, speed: 0.0045, amplitude: 75 },
    ],
  },
  // Level 5: Solar Citadel Orbit (Medium)
  {
    name: 'Solar Citadel',
    themeTitle: 'Perimeter Quadrant Orbit',
    bgTheme: '#FEF9E7',
    dotColor: '#F9E79F',
    pathColor: '#B7950B',
    glowColor: 'rgba(183, 149, 11, 0.6)',
    obsColor: '#E67E22',
    obsAccent: '#BA4A00',
    obsShape: 'star',
    start: { x: 425, y: 60 },
    end: { x: 425, y: 420 },
    checkpoints: [{ x: 120, y: 240 }, { x: 730, y: 240 }, { x: 425, y: 240 }],
    obstacles: [
      { x: 290, y: 160, radius: 25, baseY: 160, speed: 0.004, amplitude: 55 },
      { x: 560, y: 160, radius: 25, baseY: 160, speed: 0.004, amplitude: 55 },
      { x: 290, y: 320, radius: 25, baseY: 320, speed: 0.004, amplitude: 55 },
      { x: 560, y: 320, radius: 25, baseY: 320, speed: 0.004, amplitude: 55 },
    ],
  },
  // Level 6: Volcanic Caldera (Hard)
  {
    name: 'Volcanic Caldera',
    themeTitle: 'Triple Magma Slalom',
    bgTheme: '#FDEDEC',
    dotColor: '#F5B7B1',
    pathColor: '#C0392B',
    glowColor: 'rgba(192, 57, 43, 0.6)',
    obsColor: '#7D3C98',
    obsAccent: '#512E5F',
    obsShape: 'diamond',
    start: { x: 80, y: 90 },
    end: { x: 770, y: 390 },
    checkpoints: [{ x: 220, y: 370 }, { x: 380, y: 100 }, { x: 550, y: 370 }, { x: 690, y: 110 }],
    obstacles: [
      { x: 160, y: 220, radius: 25, baseY: 220, speed: 0.0042, amplitude: 70 },
      { x: 300, y: 260, radius: 25, baseY: 260, speed: 0.0045, amplitude: 75 },
      { x: 460, y: 210, radius: 25, baseY: 210, speed: 0.004, amplitude: 70 },
      { x: 600, y: 250, radius: 25, baseY: 250, speed: 0.0048, amplitude: 75 },
      { x: 710, y: 260, radius: 25, baseY: 260, speed: 0.004, amplitude: 65 },
    ],
  },
  // Level 7: Arctic Glacial Slalom (Hard)
  {
    name: 'Arctic Glacial',
    themeTitle: 'Frost Needle Slalom',
    bgTheme: '#E8F8F5',
    dotColor: '#A3E4D7',
    pathColor: '#16A085',
    glowColor: 'rgba(22, 160, 133, 0.6)',
    obsColor: '#2980B9',
    obsAccent: '#1B4F72',
    obsShape: 'circle',
    start: { x: 80, y: 390 },
    end: { x: 770, y: 90 },
    checkpoints: [{ x: 220, y: 110 }, { x: 400, y: 370 }, { x: 560, y: 110 }, { x: 680, y: 360 }],
    obstacles: [
      { x: 170, y: 240, radius: 26, baseY: 240, speed: 0.0045, amplitude: 80 },
      { x: 310, y: 140, radius: 26, baseY: 140, speed: 0.005, amplitude: 80 },
      { x: 470, y: 330, radius: 26, baseY: 330, speed: 0.0045, amplitude: 80 },
      { x: 610, y: 150, radius: 26, baseY: 150, speed: 0.0052, amplitude: 80 },
      { x: 720, y: 240, radius: 26, baseY: 240, speed: 0.0042, amplitude: 70 },
    ],
  },
  // Level 8: Amethyst Cavern Labyrinth (Hard)
  {
    name: 'Amethyst Cavern',
    themeTitle: 'Prismatic Crystal Matrix',
    bgTheme: '#F5EEF8',
    dotColor: '#D2B4DE',
    pathColor: '#7D3C98',
    glowColor: 'rgba(125, 60, 152, 0.6)',
    obsColor: '#D35400',
    obsAccent: '#A04000',
    obsShape: 'shield',
    start: { x: 80, y: 80 },
    end: { x: 770, y: 400 },
    checkpoints: [{ x: 180, y: 380 }, { x: 360, y: 80 }, { x: 540, y: 380 }, { x: 690, y: 100 }],
    obstacles: [
      { x: 140, y: 190, radius: 25, baseY: 190, speed: 0.0045, amplitude: 70 },
      { x: 260, y: 300, radius: 25, baseY: 300, speed: 0.0048, amplitude: 75 },
      { x: 380, y: 200, radius: 25, baseY: 200, speed: 0.0042, amplitude: 70 },
      { x: 500, y: 290, radius: 25, baseY: 290, speed: 0.005, amplitude: 75 },
      { x: 620, y: 190, radius: 25, baseY: 190, speed: 0.0045, amplitude: 70 },
      { x: 720, y: 280, radius: 25, baseY: 280, speed: 0.0052, amplitude: 75 },
    ],
  },
  // Level 9: Cosmic Singularity (Expert)
  {
    name: 'Cosmic Singularity',
    themeTitle: 'Hexa-Crosswind Vortex',
    bgTheme: '#EAECEE',
    dotColor: '#BDC3C7',
    pathColor: '#2C3E50',
    glowColor: 'rgba(44, 62, 80, 0.6)',
    obsColor: '#C0392B',
    obsAccent: '#78281F',
    obsShape: 'gear',
    start: { x: 90, y: 390 },
    end: { x: 760, y: 90 },
    checkpoints: [
      { x: 200, y: 110 },
      { x: 340, y: 370 },
      { x: 480, y: 110 },
      { x: 620, y: 370 },
      { x: 710, y: 210 },
    ],
    obstacles: [
      { x: 150, y: 250, radius: 25, baseY: 250, speed: 0.005, amplitude: 80 },
      { x: 270, y: 160, radius: 25, baseY: 160, speed: 0.0055, amplitude: 80 },
      { x: 400, y: 320, radius: 25, baseY: 320, speed: 0.005, amplitude: 80 },
      { x: 520, y: 150, radius: 25, baseY: 150, speed: 0.0055, amplitude: 80 },
      { x: 640, y: 290, radius: 25, baseY: 290, speed: 0.005, amplitude: 80 },
      { x: 730, y: 320, radius: 25, baseY: 320, speed: 0.0045, amplitude: 70 },
    ],
  },
  // Level 10: Celestial Odyssey (Expert)
  {
    name: 'Celestial Odyssey',
    themeTitle: 'Grand Heptagonal Spiral',
    bgTheme: '#F8F9F9',
    dotColor: '#D5D8DC',
    pathColor: '#D35400',
    glowColor: 'rgba(211, 84, 0, 0.6)',
    obsColor: '#8E44AD',
    obsAccent: '#4A235A',
    obsShape: 'star',
    start: { x: 425, y: 240 }, // Center start!
    end: { x: 760, y: 400 },
    checkpoints: [
      { x: 110, y: 90 },
      { x: 740, y: 90 },
      { x: 110, y: 390 },
      { x: 425, y: 70 },
      { x: 590, y: 300 },
    ],
    obstacles: [
      { x: 170, y: 160, radius: 24, baseY: 160, speed: 0.005, amplitude: 75 },
      { x: 290, y: 300, radius: 24, baseY: 300, speed: 0.0055, amplitude: 75 },
      { x: 425, y: 120, radius: 24, baseY: 120, speed: 0.0048, amplitude: 60 },
      { x: 425, y: 360, radius: 24, baseY: 360, speed: 0.0048, amplitude: 60 },
      { x: 550, y: 170, radius: 24, baseY: 170, speed: 0.0055, amplitude: 75 },
      { x: 670, y: 290, radius: 24, baseY: 290, speed: 0.005, amplitude: 75 },
      { x: 730, y: 160, radius: 24, baseY: 160, speed: 0.0052, amplitude: 70 },
    ],
  },
];

export const PathWeaver: React.FC<{
  onBack: () => void;
  initialLevel?: number;
}> = ({ onBack, initialLevel = 1 }) => {
  const TOTAL_ROUNDS = 10;
  const [currentRound, setCurrentRound] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [isWrongWobble, setIsWrongWobble] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<{ text: string; isSuccess: boolean } | null>(null);

  const [metrics, setMetrics] = useState<GameMetrics>(() =>
    AdaptiveEngine.createInitialMetrics(initialLevel)
  );

  const [levelConfig, setLevelConfig] = useState<TrailLevelConfig>(TRAIL_LEVELS[0]);

  // High-performance canvas refs to guarantee 60fps buttery smooth drawing without React lag
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pathPointsRef = useRef<Point[]>([]);
  const isDrawingRef = useRef<boolean>(false);
  const currentPointerRef = useRef<Point | null>(null);
  const nextCheckpointIdxRef = useRef<number>(0);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const roundStartTimeRef = useRef<number>(Date.now());
  const animFrameRef = useRef<number | null>(null);

  const setupRound = useCallback((roundNum: number) => {
    setIsWon(false);
    setIsWrongWobble(false);
    setFeedbackNotice(null);
    pathPointsRef.current = [];
    isDrawingRef.current = false;
    currentPointerRef.current = null;
    nextCheckpointIdxRef.current = 0;
    roundStartTimeRef.current = Date.now();

    const config = TRAIL_LEVELS[(roundNum - 1) % TRAIL_LEVELS.length];
    setLevelConfig(config);
    obstaclesRef.current = config.obstacles.map((obs) => ({ ...obs }));
  }, []);

  useEffect(() => {
    setupRound(1);
  }, [setupRound]);

  // High-performance 60fps Canvas render loop (Zero React state overhead during drawing!)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let startTime = Date.now();

    const render = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const config = levelConfig;

      // 1. Update obstacle physics smoothly
      obstaclesRef.current = config.obstacles.map((obs) => {
        if (!obs.speed || obs.baseY === undefined) return obs;
        const amp = obs.amplitude || 60;
        const offset = Math.sin(elapsed * obs.speed) * amp;
        return { ...obs, y: obs.baseY + offset };
      });

      // 2. Clear canvas with themed background
      ctx.clearRect(0, 0, 850, 480);
      ctx.fillStyle = config.bgTheme;
      ctx.fillRect(0, 0, 850, 480);

      // Background dot grid
      ctx.fillStyle = config.dotColor;
      for (let x = 20; x < 850; x += 30) {
        for (let y = 20; y < 480; y += 30) {
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. Draw Checkpoints
      config.checkpoints.forEach((cp, idx) => {
        const isCollected = idx < nextCheckpointIdxRef.current;
        const isNext = idx === nextCheckpointIdxRef.current;

        if (isNext) {
          // Pulsing target beacon
          const pulse = Math.sin(elapsed * 0.006) * 6;
          ctx.beginPath();
          ctx.arc(cp.x, cp.y, 22 + pulse, 0, Math.PI * 2);
          ctx.fillStyle = config.glowColor;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(cp.x, cp.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = isCollected ? '#2ECC71' : isNext ? config.pathColor : '#BDC3C7';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(idx + 1), cp.x, cp.y);
      });

      // 4. Draw Start and Goal nodes
      // Start
      ctx.beginPath();
      ctx.arc(config.start.x, config.start.y, 24, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(46, 204, 113, 0.25)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(config.start.x, config.start.y, 19, 0, Math.PI * 2);
      ctx.fillStyle = '#38B07D';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(config.start.x, config.start.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.fillStyle = '#248259';
      ctx.font = '900 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('START', config.start.x, config.start.y + 34);

      // Goal
      ctx.beginPath();
      ctx.arc(config.end.x, config.end.y, 26, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245, 166, 35, 0.25)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(config.end.x, config.end.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = '#F5A623';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(config.end.x, config.end.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.fillStyle = '#C97E06';
      ctx.font = '900 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GOAL', config.end.x, config.end.y + 34);

      // 5. Draw Obstacles according to level config shape
      obstaclesRef.current.forEach((obs) => {
        const shape = config.obsShape;
        const color = config.obsColor;
        const accent = config.obsAccent;
        const r = obs.radius;

        ctx.save();
        if (shape === 'diamond') {
          ctx.beginPath();
          ctx.moveTo(obs.x, obs.y - r);
          ctx.lineTo(obs.x + r, obs.y);
          ctx.lineTo(obs.x, obs.y + r);
          ctx.lineTo(obs.x - r, obs.y);
          ctx.closePath();
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = accent;
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(obs.x, obs.y, r * 0.35, 0, Math.PI * 2);
          ctx.fill();
        } else if (shape === 'star') {
          ctx.beginPath();
          for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI) / 5 - Math.PI / 2;
            const rad = i % 2 === 0 ? r : r * 0.45;
            const px = obs.x + Math.cos(angle) * rad;
            const py = obs.y + Math.sin(angle) * rad;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = accent;
          ctx.lineWidth = 3;
          ctx.stroke();
        } else if (shape === 'shield') {
          const w = r * 1.5;
          const h = r * 1.5;
          ctx.beginPath();
          ctx.roundRect(obs.x - w / 2, obs.y - h / 2, w, h, r * 0.35);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = accent;
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(obs.x, obs.y, r * 0.3, 0, Math.PI * 2);
          ctx.fill();
        } else if (shape === 'gear') {
          ctx.beginPath();
          ctx.arc(obs.x, obs.y, r, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = accent;
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(obs.x, obs.y, r * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
        } else {
          // Default circle orb
          ctx.beginPath();
          ctx.arc(obs.x, obs.y, r, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = accent;
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(obs.x - 7, obs.y - 5, 3.5, 0, Math.PI * 2);
          ctx.arc(obs.x + 7, obs.y - 5, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // 6. Draw Smooth Fluid Trail Ribbon
      const points = pathPointsRef.current;
      if (points.length > 1) {
        ctx.save();

        // Glowing outer stroke
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          const xc = (points[i - 1].x + points[i].x) / 2;
          const yc = (points[i - 1].y + points[i].y) / 2;
          ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = isWon ? '#2ECC71' : config.pathColor;
        ctx.lineWidth = 10;
        ctx.shadowColor = config.glowColor;
        ctx.shadowBlur = 12;
        ctx.stroke();

        // Inner glowing core
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3.5;
        ctx.shadowBlur = 0;
        ctx.stroke();

        ctx.restore();
      }

      // 7. Draw Pen Cursor Tip if actively drawing
      if (isDrawingRef.current && currentPointerRef.current) {
        const ptr = currentPointerRef.current;
        ctx.save();
        ctx.beginPath();
        ctx.arc(ptr.x, ptr.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = config.pathColor;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [levelConfig, isWon]);

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 850;
    const y = ((e.clientY - rect.top) / rect.height) * 480;
    return {
      x: Math.max(0, Math.min(850, x)),
      y: Math.max(0, Math.min(480, y)),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isWon || isWrongWobble) return;
    const pt = getCanvasCoords(e);
    currentPointerRef.current = pt;

    // 1. Press on or near START (generous 70px hit area)
    const distToStart = Math.hypot(pt.x - levelConfig.start.x, pt.y - levelConfig.start.y);
    if (distToStart < 70) {
      sounds.playTap();
      isDrawingRef.current = true;
      pathPointsRef.current = [levelConfig.start];
      nextCheckpointIdxRef.current = 0;
      try {
        (e.target as Element).setPointerCapture(e.pointerId);
      } catch {}
      return;
    }

    // 2. Resume drawing near the current trail tip
    if (pathPointsRef.current.length > 0) {
      const last = pathPointsRef.current[pathPointsRef.current.length - 1];
      if (Math.hypot(pt.x - last.x, pt.y - last.y) < 55) {
        isDrawingRef.current = true;
        try {
          (e.target as Element).setPointerCapture(e.pointerId);
        } catch {}
        return;
      }
    }

    // 3. Tap directly on next checkpoint (auto-connects smoothly!)
    if (levelConfig.checkpoints.length > 0 && nextCheckpointIdxRef.current < levelConfig.checkpoints.length) {
      const targetCp = levelConfig.checkpoints[nextCheckpointIdxRef.current];
      if (Math.hypot(pt.x - targetCp.x, pt.y - targetCp.y) < 45) {
        sounds.playNote(659.25, 0.2);
        nextCheckpointIdxRef.current += 1;
        pathPointsRef.current = pathPointsRef.current.length === 0
          ? [levelConfig.start, targetCp]
          : [...pathPointsRef.current, targetCp];
        return;
      }
    }

    // 4. Tap directly on GOAL when checkpoints cleared
    if (Math.hypot(pt.x - levelConfig.end.x, pt.y - levelConfig.end.y) < 50) {
      if (nextCheckpointIdxRef.current >= levelConfig.checkpoints.length) {
        pathPointsRef.current = pathPointsRef.current.length === 0
          ? [levelConfig.start, levelConfig.end]
          : [...pathPointsRef.current, levelConfig.end];
        finishLevelSuccess();
      }
    }
  };

  const finishLevelSuccess = () => {
    if (isWon) return;
    isDrawingRef.current = false;
    setIsWon(true);
    sounds.playCorrect();
    setCorrectCount((c) => c + 1);
    const points = currentRound >= 8 ? 160 : currentRound >= 5 ? 130 : 100;
    setFeedbackNotice({ text: `+${points} pts! Trail Navigated!`, isSuccess: true });
    const elapsed = Date.now() - roundStartTimeRef.current;

    const { nextMetrics } = AdaptiveEngine.recordRound(metrics, true, elapsed);
    setMetrics(nextMetrics);

    // Continuous flow into next trail after 800ms
    setTimeout(() => {
      if (currentRound >= TOTAL_ROUNDS) {
        setIsCompleted(true);
      } else {
        const nextR = currentRound + 1;
        setCurrentRound(nextR);
        setupRound(nextR);
      }
    }, 800);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || isWon || isWrongWobble) return;
    const pt = getCanvasCoords(e);
    currentPointerRef.current = pt;

    // Check collision against moving obstacles
    for (const obs of obstaclesRef.current) {
      const dist = Math.hypot(pt.x - obs.x, pt.y - obs.y);
      if (dist < obs.radius + 6) {
        sounds.playIncorrect();
        setIsWrongWobble(true);
        isDrawingRef.current = false;
        pathPointsRef.current = [];
        nextCheckpointIdxRef.current = 0;
        setFeedbackNotice({ text: 'Obstacle Bumped! Start path again from START', isSuccess: false });
        setTimeout(() => {
          setIsWrongWobble(false);
          setFeedbackNotice(null);
        }, 700);
        return;
      }
    }

    // Check sequential checkpoint collection
    if (levelConfig.checkpoints.length > 0 && nextCheckpointIdxRef.current < levelConfig.checkpoints.length) {
      const targetCp = levelConfig.checkpoints[nextCheckpointIdxRef.current];
      if (Math.hypot(pt.x - targetCp.x, pt.y - targetCp.y) < 36) {
        sounds.playNote(659.25, 0.2);
        nextCheckpointIdxRef.current += 1;
      }
    }

    // Check reaching GOAL
    if (Math.hypot(pt.x - levelConfig.end.x, pt.y - levelConfig.end.y) < 40) {
      if (nextCheckpointIdxRef.current >= levelConfig.checkpoints.length) {
        pathPointsRef.current.push(levelConfig.end);
        finishLevelSuccess();
        return;
      }
    }

    // Append point if moved >= 3px (ultra-smooth without redundant points)
    const pts = pathPointsRef.current;
    if (pts.length === 0) {
      pathPointsRef.current = [pt];
    } else {
      const last = pts[pts.length - 1];
      if (Math.hypot(pt.x - last.x, pt.y - last.y) >= 3) {
        pts.push(pt);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {}
    isDrawingRef.current = false;
    currentPointerRef.current = null;
  };

  const handleResetTrail = () => {
    sounds.playTap();
    pathPointsRef.current = [];
    nextCheckpointIdxRef.current = 0;
    isDrawingRef.current = false;
    currentPointerRef.current = null;
  };

  const handlePlayAgain = () => {
    setCurrentRound(1);
    setCorrectCount(0);
    setIsCompleted(false);
    setMetrics(AdaptiveEngine.createInitialMetrics(1));
    setupRound(1);
  };

  const tierName = currentRound <= 2 ? 'Easy Tier' : currentRound <= 5 ? 'Medium Tier' : currentRound <= 8 ? 'Hard Tier' : 'Expert Tier';

  return (
    <div style={{ maxWidth: '1060px', width: '100%', margin: '0 auto', padding: '6px 16px', maxHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <GameHeader
        title="Path Weaver Garden"
        category="Spatial"
        themeColor="#1ABC9C"
        metrics={{ ...metrics, totalRounds: currentRound - 1 }}
        onBack={onBack}
      />

      <div
        className={`toy-card ${isWrongWobble ? 'anim-gentle-shake' : ''}`}
        style={{
          padding: '12px 18px',
          textAlign: 'center',
          backgroundColor: '#FFFFFF',
          position: 'relative',
        }}
      >
        <AnimatePresence>
          {feedbackNotice && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                top: '6px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: feedbackNotice.isSuccess ? '#E8F8F0' : '#FFF0F0',
                color: feedbackNotice.isSuccess ? '#248259' : '#D44242',
                border: `2px solid ${feedbackNotice.isSuccess ? '#38B07D' : '#FF6565'}`,
                padding: '6px 22px',
                borderRadius: '999px',
                fontWeight: 800,
                fontSize: '0.95rem',
                zIndex: 30,
                boxShadow: '0 6px 14px rgba(0,0,0,0.1)',
              }}
            >
              {feedbackNotice.text}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '2px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                padding: '2px 10px',
                borderRadius: '999px',
                backgroundColor: currentRound <= 2 ? '#E8F8F0' : currentRound <= 5 ? '#FEF7E6' : '#FDEDEC',
                color: currentRound <= 2 ? '#248259' : currentRound <= 5 ? '#C97E06' : '#C0392B',
                textTransform: 'uppercase',
              }}
            >
              {tierName}
            </span>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                padding: '2px 10px',
                borderRadius: '999px',
                backgroundColor: '#FFEAEA',
                color: '#D44242',
                border: '1px solid #FF8E8E',
                letterSpacing: '0.4px',
              }}
            >
              1 CHANCE PER LEVEL
            </span>
            <h2 style={{ fontSize: '1.25rem', color: '#2C3E50', margin: 0, fontWeight: 800 }}>
              Level {currentRound}: {levelConfig.name}
            </h2>
          </div>
          <p style={{ color: '#7F8C8D', fontSize: '0.88rem', margin: 0, fontWeight: 600 }}>
            {levelConfig.themeTitle} &bull; Drag or tap from START through all {levelConfig.checkpoints.length} checkpoint{levelConfig.checkpoints.length > 1 ? 's' : ''} to GOAL!
          </p>
        </div>

        {/* High-Performance Canvas Display (Expansive screen coverage, zero scrolling) */}
        <div
          style={{
            width: '100%',
            maxWidth: '920px',
            margin: '0 auto',
            borderRadius: '20px',
            border: '3px solid #EAE2D5',
            overflow: 'hidden',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.04)',
            backgroundColor: levelConfig.bgTheme,
          }}
        >
          <canvas
            ref={canvasRef}
            width={850}
            height={480}
            style={{
              width: '100%',
              maxHeight: '410px',
              aspectRatio: '850/480',
              display: 'block',
              cursor: 'crosshair',
              touchAction: 'none',
              userSelect: 'none',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
        </div>

        {/* Trail Controls & Guidance */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginTop: '6px' }}>
          <button
            onClick={handleResetTrail}
            className="btn-squishy btn-outline"
            style={{ padding: '4px 16px', fontSize: '0.85rem' }}
            title="Clear and redraw trail"
          >
            Reset Trail
          </button>
          <span style={{ fontSize: '0.85rem', color: '#7F8C8D', fontWeight: 600 }}>
            Smooth Pen Enabled: Press on START and draw to GOAL!
          </span>
        </div>
      </div>

      <GameCompletionModal
        isOpen={isCompleted}
        gameTitle="Path Weaver Garden"
        totalScore={metrics.score}
        correctAnswers={correctCount}
        totalQuestions={TOTAL_ROUNDS}
        onPlayAgain={handlePlayAgain}
        onBackToMap={onBack}
      />
    </div>
  );
};
