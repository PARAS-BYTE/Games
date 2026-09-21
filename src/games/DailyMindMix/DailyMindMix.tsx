import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../../audio/soundEngine';
import { MascotAvatar } from '../../components/common/Characters';
import { StarIcon } from '../../components/common/Icons';

// Sub-task views
import { MemoryGrid } from '../MemoryGrid/MemoryGrid';
import { RuleDetective } from '../RuleDetective/RuleDetective';
import { PathWeaver } from '../PathWeaver/PathWeaver';
import { MoodMatch } from '../MoodMatch/MoodMatch';

interface DailyMindMixProps {
  onBack: () => void;
}

export const DailyMindMix: React.FC<DailyMindMixProps> = ({ onBack }) => {
  const TOTAL_TASKS = 10;
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0); // 0 to 9
  const [sessionScore, setSessionScore] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  const [isFinalSummaryOpen, setIsFinalSummaryOpen] = useState(false);

  const taskDefinitions = [
    { title: '3D Memory Crystal Grid', category: 'Spatial', type: 'memory-grid', level: 1 },
    { title: 'Rule Detective 3D', category: 'Logic', type: 'rule-detective', level: 1 },
    { title: 'Mood Match & Empathy', category: 'Emotional', type: 'mood-match', level: 1 },
    { title: 'Path Weaver Garden', category: 'Spatial', type: 'path-weaver', level: 1 },
    { title: 'Memory Grid: 3D Rotate', category: 'Spatial', type: 'memory-grid', level: 2 },
    { title: 'Rule Detective: Secret Law', category: 'Logic', type: 'rule-detective', level: 2 },
    { title: 'Mood Match: Subtle Feelings', category: 'Emotional', type: 'mood-match', level: 2 },
    { title: 'Path Weaver: Moving Rocks', category: 'Spatial', type: 'path-weaver', level: 2 },
    { title: 'Rule Detective: Master Clues', category: 'Logic', type: 'rule-detective', level: 3 },
    { title: 'Memory Grid: Grand Crystal Recall', category: 'Spatial', type: 'memory-grid', level: 3 },
  ];

  const currentTask = taskDefinitions[currentTaskIndex] || taskDefinitions[0];

  const handleTaskComplete = (earnedScore: number = 100) => {
    sounds.playCorrect();
    setSessionScore((prev) => prev + earnedScore);
    const nextCompleted = [...completedTasks, currentTaskIndex];
    setCompletedTasks(nextCompleted);

    if (currentTaskIndex + 1 >= TOTAL_TASKS) {
      setTimeout(() => {
        sounds.playVictory();
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.5 },
        });
        setIsFinalSummaryOpen(true);
      }, 500);
    } else {
      setTimeout(() => {
        setCurrentTaskIndex((prev) => prev + 1);
      }, 400);
    }
  };

  const handleRestartMix = () => {
    sounds.playTap();
    setCurrentTaskIndex(0);
    setSessionScore(0);
    setCompletedTasks([]);
    setIsFinalSummaryOpen(false);
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '16px', position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '14px 24px',
          border: '3px solid #F0EAE1',
          marginBottom: '20px',
          boxShadow: '0 6px 16px rgba(0,0,0,0.04)',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => {
              sounds.playTap();
              onBack();
            }}
            className="btn-squishy btn-outline"
            style={{ padding: '8px 16px', fontSize: '0.92rem' }}
          >
            <ArrowLeft size={18} />
            <span>Map</span>
          </button>
          <div>
            <h2 style={{ fontSize: '1.25rem', color: '#2C3E50', margin: 0, fontWeight: 800 }}>
              Daily Mind Mix
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#7F8C8D', fontWeight: 700 }}>
              Task {currentTaskIndex + 1} of {TOTAL_TASKS} &bull; {currentTask.title}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {taskDefinitions.map((_, idx) => {
            const isDone = completedTasks.includes(idx);
            const isCurrent = idx === currentTaskIndex;
            return (
              <div
                key={idx}
                style={{
                  width: isCurrent ? '28px' : '14px',
                  height: '14px',
                  borderRadius: '999px',
                  backgroundColor: isDone ? '#38B07D' : isCurrent ? '#E74C3C' : '#EAE2D5',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  boxShadow: isCurrent ? '0 0 8px rgba(231,76,60,0.5)' : 'none',
                }}
              />
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#FEF7E6',
              padding: '6px 14px',
              borderRadius: '999px',
              color: '#C97E06',
              fontWeight: 800,
            }}
          >
            <StarIcon size={18} />
            <span>{sessionScore} pts</span>
          </div>

          <button
            onClick={() => handleTaskComplete(100)}
            className="btn-squishy btn-sun"
            style={{ padding: '8px 16px', fontSize: '0.88rem' }}
            title="Complete this task and advance"
          >
            <span>Skip / Next Task &rarr;</span>
          </button>
        </div>
      </div>

      <div style={{ minHeight: '520px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTaskIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentTask.type === 'memory-grid' && (
              <MemoryGrid
                onBack={onBack}
                initialLevel={currentTask.level}
              />
            )}

            {currentTask.type === 'rule-detective' && (
              <RuleDetective
                onBack={onBack}
                initialLevel={currentTask.level}
              />
            )}

            {currentTask.type === 'mood-match' && (
              <MoodMatch
                onBack={onBack}
                initialLevel={currentTask.level}
              />
            )}

            {currentTask.type === 'path-weaver' && (
              <PathWeaver
                onBack={onBack}
                initialLevel={currentTask.level}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isFinalSummaryOpen && (
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
              zIndex: 150,
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
              <MascotAvatar id="pippin" size={90} mood="cheering" />

              <h2 style={{ fontSize: '2rem', color: '#248259', margin: '14px 0 6px', fontWeight: 800 }}>
                Workout Completed!
              </h2>
              <p style={{ color: '#7F8C8D', fontSize: '1.05rem', marginBottom: '24px' }}>
                You completed all 10 mixed cognitive challenges today!
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
                {[1, 2, 3].map((s) => (
                  <StarIcon key={s} size={48} fill="#F5A623" color="#F5A623" />
                ))}
              </div>

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
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F5A623' }}>
                    {sessionScore + 250} pts
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
                  <div style={{ fontSize: '0.85rem', color: '#7F8C8D', fontWeight: 700 }}>Tasks Solved</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38B07D' }}>
                    10 / 10 Done
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={handleRestartMix}
                  className="btn-squishy btn-sun"
                  style={{ width: '100%', fontSize: '1.15rem', padding: '14px' }}
                >
                  <Sparkles size={20} />
                  <span>Play Another Mix</span>
                </button>
                <button
                  onClick={() => {
                    sounds.playTap();
                    onBack();
                  }}
                  className="btn-squishy btn-outline"
                  style={{ width: '100%', fontSize: '1.05rem', padding: '12px' }}
                >
                  Back to Adventure Map
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
