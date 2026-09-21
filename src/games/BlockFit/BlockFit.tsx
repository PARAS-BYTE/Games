import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, RotateCw, ArrowDown } from 'lucide-react';
import { GameHeader } from '../../components/common/GameHeader';
import { ScoreTallyModal } from '../../components/common/ScoreTallyModal';
import { AdaptiveEngine } from '../../engine/AdaptiveEngine';
import type { GameMetrics } from '../../engine/types';
import { sounds } from '../../audio/soundEngine';

interface Piece {
  shape: number[][];
  color: string;
}

const PIECES: Piece[] = [
  {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: '#F5A623',
  },
  {
    shape: [
      [1, 1, 1],
    ],
    color: '#3CA2FF',
  },
  {
    shape: [
      [1, 0],
      [1, 0],
      [1, 1],
    ],
    color: '#FF6565',
  },
  {
    shape: [
      [1, 1, 1],
      [0, 1, 0],
    ],
    color: '#9B59B6',
  },
];

const BOARD_COLS = 6;
const BOARD_ROWS = 7;

export const BlockFit: React.FC<{
  onBack: () => void;
  initialLevel?: number;
}> = ({ onBack, initialLevel = 1 }) => {
  const [metrics, setMetrics] = useState<GameMetrics>(() =>
    AdaptiveEngine.createInitialMetrics(initialLevel)
  );

  const [currentPiece, setCurrentPiece] = useState<Piece>(PIECES[0]);
  const [pieceCol, setPieceCol] = useState(2);
  const [pieceRow, setPieceRow] = useState(0);
  const [boardGrid, setBoardGrid] = useState<string[][]>(() =>
    Array(BOARD_ROWS).fill(null).map(() => Array(BOARD_COLS).fill(''))
  );
  const [isLanding, setIsLanding] = useState(false);
  const [roundStartTime, setRoundStartTime] = useState(Date.now());
  const [isTallyOpen, setIsTallyOpen] = useState(false);
  const [lastRoundResult, setLastRoundResult] = useState({
    isCorrect: false,
    score: 0,
    levelShift: 0,
    newLevel: 1,
    timeMs: 0,
  });

  const fallTimerRef = useRef<number | null>(null);

  const rotateMatrix = (matrix: number[][]): number[][] => {
    return matrix[0].map((_, index) => matrix.map((row) => row[index]).reverse());
  };

  const checkCollision = (shape: number[][], r: number, c: number, grid: string[][]): boolean => {
    for (let rowIdx = 0; rowIdx < shape.length; rowIdx++) {
      for (let colIdx = 0; colIdx < shape[rowIdx].length; colIdx++) {
        if (shape[rowIdx][colIdx] === 1) {
          const boardR = r + rowIdx;
          const boardC = c + colIdx;
          if (boardC < 0 || boardC >= BOARD_COLS || boardR >= BOARD_ROWS) {
            return true;
          }
          if (boardR >= 0 && grid[boardR][boardC] !== '') {
            return true;
          }
        }
      }
    }
    return false;
  };

  const getShadowRow = (shape: number[][], col: number, grid: string[][]): number => {
    let r = 0;
    while (!checkCollision(shape, r + 1, col, grid)) {
      r++;
    }
    return r;
  };

  const startNewRound = () => {
    setIsTallyOpen(false);
    setIsLanding(false);
    setRoundStartTime(Date.now());

    const newGrid: string[][] = Array(BOARD_ROWS).fill(null).map(() => Array(BOARD_COLS).fill(''));

    const pIdx = Math.floor(Math.random() * PIECES.length);
    const piece = PIECES[pIdx];
    setCurrentPiece(piece);
    setPieceCol(Math.floor((BOARD_COLS - piece.shape[0].length) / 2));
    setPieceRow(0);

    const bottomRow = BOARD_ROWS - 1;
    const gapStart = Math.floor(Math.random() * (BOARD_COLS - piece.shape[0].length));
    for (let c = 0; c < BOARD_COLS; c++) {
      if (c < gapStart || c >= gapStart + piece.shape[0].length) {
        newGrid[bottomRow][c] = '#D4C9B8';
      }
    }
    setBoardGrid(newGrid);
  };

  useEffect(() => {
    startNewRound();
  }, [metrics.currentLevel]);

  useEffect(() => {
    const speed = metrics.currentLevel <= 5 ? 1200 : metrics.currentLevel <= 10 ? 800 : 500;
    fallTimerRef.current = window.setInterval(() => {
      setPieceRow((prevRow) => {
        if (!checkCollision(currentPiece.shape, prevRow + 1, pieceCol, boardGrid)) {
          return prevRow + 1;
        } else {
          handleLand(prevRow);
          return prevRow;
        }
      });
    }, speed);

    return () => {
      if (fallTimerRef.current) clearInterval(fallTimerRef.current);
    };
  }, [currentPiece, pieceCol, boardGrid, metrics.currentLevel]);

  const handleLand = (finalRow: number) => {
    if (fallTimerRef.current) clearInterval(fallTimerRef.current);
    setIsLanding(true);
    sounds.playTap();

    const landedGrid = boardGrid.map((r) => [...r]);
    currentPiece.shape.forEach((rArr, rIdx) => {
      rArr.forEach((val, cIdx) => {
        if (val === 1) {
          const br = finalRow + rIdx;
          const bc = pieceCol + cIdx;
          if (br >= 0 && br < BOARD_ROWS && bc >= 0 && bc < BOARD_COLS) {
            landedGrid[br][bc] = currentPiece.color;
          }
        }
      });
    });

    const isBottomRowFull = landedGrid[BOARD_ROWS - 1].every((cell) => cell !== '');
    const elapsed = Date.now() - roundStartTime;

    if (isBottomRowFull) {
      sounds.playCorrect();
    } else {
      sounds.playIncorrect();
    }

    setTimeout(() => {
      const { nextMetrics, levelShift, roundScore } = AdaptiveEngine.recordRound(
        metrics,
        isBottomRowFull,
        elapsed
      );
      setMetrics(nextMetrics);
      setLastRoundResult({
        isCorrect: isBottomRowFull,
        score: roundScore,
        levelShift,
        newLevel: nextMetrics.currentLevel,
        timeMs: elapsed,
      });
      setIsTallyOpen(true);
    }, 600);
  };

  const handleMoveLeft = () => {
    if (pieceCol > 0 && !checkCollision(currentPiece.shape, pieceRow, pieceCol - 1, boardGrid)) {
      sounds.playTap();
      setPieceCol((prev) => prev - 1);
    }
  };

  const handleMoveRight = () => {
    if (!checkCollision(currentPiece.shape, pieceRow, pieceCol + 1, boardGrid)) {
      sounds.playTap();
      setPieceCol((prev) => prev + 1);
    }
  };

  const handleRotate = () => {
    const rotated = rotateMatrix(currentPiece.shape);
    if (!checkCollision(rotated, pieceRow, pieceCol, boardGrid)) {
      sounds.playTap();
      setCurrentPiece({ ...currentPiece, shape: rotated });
    }
  };

  const handleHardDrop = () => {
    const shadowR = getShadowRow(currentPiece.shape, pieceCol, boardGrid);
    setPieceRow(shadowR);
    handleLand(shadowR);
  };

  const shadowRow = getShadowRow(currentPiece.shape, pieceCol, boardGrid);

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '16px' }}>
      <GameHeader
        title="Block Fit"
        category="Spatial"
        themeColor="#F5A623"
        metrics={metrics}
        onBack={onBack}
      />

      <div
        className="toy-card"
        style={{
          padding: '24px',
          textAlign: 'center',
          backgroundColor: '#FFFFFF',
          minHeight: '480px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <h2 style={{ fontSize: '1.4rem', color: '#2C3E50', marginBottom: '6px', fontWeight: 700 }}>
          Align the falling block with the gap!
        </h2>
        <p style={{ color: '#7F8C8D', fontSize: '0.92rem', marginBottom: '16px' }}>
          Follow the dashed ghost shadow to predict placement.
        </p>

        <div
          style={{
            position: 'relative',
            width: `${BOARD_COLS * 46}px`,
            height: `${BOARD_ROWS * 46}px`,
            backgroundColor: '#FAF7F2',
            borderRadius: '20px',
            border: '3px solid #EAE2D5',
            overflow: 'hidden',
            margin: '0 auto 20px',
          }}
        >
          {boardGrid.map((row, r) =>
            row.map((color, c) => (
              <div
                key={`${r}-${c}`}
                style={{
                  position: 'absolute',
                  top: `${r * 46}px`,
                  left: `${c * 46}px`,
                  width: '44px',
                  height: '44px',
                  backgroundColor: color || 'transparent',
                  borderRadius: '10px',
                  border: color ? '2px solid rgba(0,0,0,0.1)' : 'none',
                }}
              />
            ))
          )}

          {currentPiece.shape.map((rArr, rIdx) =>
            rArr.map((val, cIdx) => {
              if (val === 0) return null;
              return (
                <div
                  key={`shadow-${rIdx}-${cIdx}`}
                  style={{
                    position: 'absolute',
                    top: `${(shadowRow + rIdx) * 46}px`,
                    left: `${(pieceCol + cIdx) * 46}px`,
                    width: '44px',
                    height: '44px',
                    backgroundColor: `${currentPiece.color}30`,
                    border: `2px dashed ${currentPiece.color}`,
                    borderRadius: '10px',
                    pointerEvents: 'none',
                  }}
                />
              );
            })
          )}

          <motion.div
            animate={{
              scaleY: isLanding ? 0.88 : 1,
            }}
            transition={{ duration: 0.15 }}
          >
            {currentPiece.shape.map((rArr, rIdx) =>
              rArr.map((val, cIdx) => {
                if (val === 0) return null;
                return (
                  <div
                    key={`piece-${rIdx}-${cIdx}`}
                    style={{
                      position: 'absolute',
                      top: `${(pieceRow + rIdx) * 46}px`,
                      left: `${(pieceCol + cIdx) * 46}px`,
                      width: '44px',
                      height: '44px',
                      backgroundColor: currentPiece.color,
                      borderRadius: '10px',
                      boxShadow: `0 3px 0 rgba(0,0,0,0.15)`,
                      border: '2px solid rgba(255,255,255,0.4)',
                    }}
                  />
                );
              })
            )}
          </motion.div>
        </div>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={handleMoveLeft}
            className="btn-squishy btn-outline"
            style={{ padding: '12px 18px' }}
          >
            <ArrowLeft size={20} />
            <span>Left</span>
          </button>
          <button
            onClick={handleRotate}
            className="btn-squishy btn-sun"
            style={{ padding: '12px 20px' }}
          >
            <RotateCw size={20} />
            <span>Rotate</span>
          </button>
          <button
            onClick={handleMoveRight}
            className="btn-squishy btn-outline"
            style={{ padding: '12px 18px' }}
          >
            <span>Right</span>
            <ArrowRight size={20} />
          </button>
          <button
            onClick={handleHardDrop}
            className="btn-squishy btn-mint"
            style={{ padding: '12px 20px' }}
          >
            <ArrowDown size={20} />
            <span>Drop</span>
          </button>
        </div>
      </div>

      <ScoreTallyModal
        isOpen={isTallyOpen}
        isCorrect={lastRoundResult.isCorrect}
        roundScore={lastRoundResult.score}
        levelShift={lastRoundResult.levelShift}
        newLevel={lastRoundResult.newLevel}
        accuracy={metrics.accuracy}
        responseTimeMs={lastRoundResult.timeMs}
        onNextRound={startNewRound}
        onExitToMap={onBack}
      />
    </div>
  );
};
