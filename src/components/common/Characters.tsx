import React from 'react';
import { motion } from 'framer-motion';

export type MascotId = 'pippin' | 'barnaby' | 'nova' | 'luna' | 'dexter' | 'cleo';

interface MascotProps {
  id: MascotId;
  size?: number;
  mood?: 'happy' | 'cheering' | 'thinking' | 'sleeping';
  className?: string;
}

export const MascotAvatar: React.FC<MascotProps> = ({
  id,
  size = 72,
  mood = 'happy',
  className = '',
}) => {
  // 1. Pippin the Forest Sprout
  if (id === 'pippin') {
    return (
      <motion.div
        animate={{
          y: mood === 'cheering' ? [-4, -14, -4] : [-2, 2, -2],
          rotate: mood === 'cheering' ? [-3, 3, -3] : [0, 1, 0],
        }}
        transition={{ duration: mood === 'cheering' ? 0.6 : 2.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: size, height: size, display: 'inline-block' }}
        className={className}
      >
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <motion.path
            d="M50 24 Q36 6 22 18 Q34 35 48 26"
            fill="#27AE60"
            animate={{ rotate: [-4, 4, -4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.path
            d="M50 24 Q64 6 78 18 Q66 35 52 26"
            fill="#2ECC71"
            animate={{ rotate: [4, -4, 4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <circle cx="50" cy="58" r="36" fill="#38B07D" />
          <circle cx="30" cy="64" r="6" fill="#FF7675" opacity="0.45" />
          <circle cx="70" cy="64" r="6" fill="#FF7675" opacity="0.45" />

          {mood === 'cheering' ? (
            <>
              <path d="M32 54 Q38 46 44 54" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M56 54 Q62 46 68 54" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none" />
            </>
          ) : (
            <>
              <circle cx="38" cy="52" r="5" fill="#FFFFFF" />
              <circle cx="39" cy="51" r="2" fill="#2C3E50" />
              <circle cx="62" cy="52" r="5" fill="#FFFFFF" />
              <circle cx="63" cy="51" r="2" fill="#2C3E50" />
            </>
          )}

          <path
            d={mood === 'cheering' ? 'M36 66 Q50 82 64 66 Z' : 'M40 65 Q50 74 60 65'}
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill={mood === 'cheering' ? '#FFFFFF' : 'none'}
          />
        </svg>
      </motion.div>
    );
  }

  // 2. Barnaby the Honey Bear
  if (id === 'barnaby') {
    return (
      <motion.div
        animate={{
          y: mood === 'cheering' ? [-3, -12, -3] : [-2, 2, -2],
        }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: size, height: size, display: 'inline-block' }}
        className={className}
      >
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <circle cx="24" cy="28" r="14" fill="#C67D3A" />
          <circle cx="24" cy="28" r="8" fill="#F4A261" />
          <circle cx="76" cy="28" r="14" fill="#C67D3A" />
          <circle cx="76" cy="28" r="8" fill="#F4A261" />

          <circle cx="50" cy="56" r="38" fill="#D38A4A" />
          <ellipse cx="50" cy="64" rx="18" ry="14" fill="#F4C794" />
          <ellipse cx="50" cy="58" rx="7" ry="5" fill="#4A2E12" />
          <path d="M50 63 L50 69 M44 69 Q50 74 56 69" stroke="#4A2E12" strokeWidth="2.5" strokeLinecap="round" fill="none" />

          <circle cx="35" cy="48" r="4.5" fill="#4A2E12" />
          <circle cx="65" cy="48" r="4.5" fill="#4A2E12" />
          <circle cx="36" cy="46.5" r="1.5" fill="#FFFFFF" />
          <circle cx="66" cy="46.5" r="1.5" fill="#FFFFFF" />
        </svg>
      </motion.div>
    );
  }

  // 3. Nova the Star-Fox
  if (id === 'nova') {
    return (
      <motion.div
        animate={{
          rotate: mood === 'cheering' ? [-5, 5, -5] : [-2, 2, -2],
          y: [-2, 2, -2],
        }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: size, height: size, display: 'inline-block' }}
        className={className}
      >
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <polygon points="20 48 30 14 46 36" fill="#E67E22" />
          <polygon points="25 44 32 22 42 36" fill="#FAD7A0" />
          <polygon points="80 48 70 14 54 36" fill="#E67E22" />
          <polygon points="75 44 68 22 58 36" fill="#FAD7A0" />

          <polygon points="18 50 50 86 82 50 50 34" fill="#F39C12" />
          <polygon points="28 54 50 86 72 54" fill="#FFFFFF" />

          <circle cx="50" cy="80" r="5" fill="#2C3E50" />
          <circle cx="38" cy="50" r="4" fill="#2C3E50" />
          <circle cx="62" cy="50" r="4" fill="#2C3E50" />
          <circle cx="39" cy="48.5" r="1.5" fill="#FFFFFF" />
          <circle cx="63" cy="48.5" r="1.5" fill="#FFFFFF" />
        </svg>
      </motion.div>
    );
  }

  // 4. Luna the Zen Owl
  if (id === 'luna') {
    return (
      <motion.div
        animate={{
          y: [-3, 3, -3],
        }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: size, height: size, display: 'inline-block' }}
        className={className}
      >
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <polygon points="24 38 18 16 38 28" fill="#7D5BA6" />
          <polygon points="76 38 82 16 62 28" fill="#7D5BA6" />

          <ellipse cx="50" cy="56" rx="36" ry="38" fill="#9B59B6" />
          <ellipse cx="50" cy="62" rx="24" ry="26" fill="#F4ECF7" />

          <circle cx="36" cy="46" r="12" fill="#FFFFFF" stroke="#8E44AD" strokeWidth="2.5" />
          <circle cx="64" cy="46" r="12" fill="#FFFFFF" stroke="#8E44AD" strokeWidth="2.5" />
          <circle cx="36" cy="46" r="5" fill="#2C3E50" />
          <circle cx="64" cy="46" r="5" fill="#2C3E50" />
          <circle cx="38" cy="44" r="1.8" fill="#FFFFFF" />
          <circle cx="66" cy="44" r="1.8" fill="#FFFFFF" />

          <polygon points="50 50 44 60 56 60" fill="#F39C12" />
        </svg>
      </motion.div>
    );
  }

  // 5. Dexter the Robo-Tinkerer
  if (id === 'dexter') {
    return (
      <motion.div
        animate={{
          y: mood === 'cheering' ? [-4, -12, -4] : [-1, 2, -1],
          rotate: mood === 'cheering' ? [-4, 4, -4] : 0,
        }}
        transition={{ duration: 2.0, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: size, height: size, display: 'inline-block' }}
        className={className}
      >
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          {/* Antenna */}
          <line x1="50" y1="20" x2="50" y2="8" stroke="#7F8C8D" strokeWidth="4" strokeLinecap="round" />
          <circle cx="50" cy="8" r="6" fill="#FF6565" />

          {/* Robo Head */}
          <rect x="22" y="20" width="56" height="52" rx="16" fill="#3CA2FF" />
          <rect x="28" y="28" width="44" height="26" rx="8" fill="#2C3E50" />

          {/* LED Visor Eyes */}
          <rect x="34" y="36" width="12" height="10" rx="3" fill="#55EFC4" />
          <rect x="54" y="36" width="12" height="10" rx="3" fill="#55EFC4" />

          {/* Bolts */}
          <circle cx="16" cy="46" r="4" fill="#BDC3C7" />
          <circle cx="84" cy="46" r="4" fill="#BDC3C7" />

          {/* Smile meter */}
          <path d="M38 60 Q50 68 62 60" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      </motion.div>
    );
  }

  // 6. Cleo the Rainbow Chameleon
  return (
    <motion.div
      animate={{
        rotate: mood === 'cheering' ? [-6, 6, -6] : [-2, 2, -2],
        y: [-2, 2, -2],
      }}
      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      style={{ width: size, height: size, display: 'inline-block' }}
      className={className}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        {/* Crest */}
        <path d="M26 30 Q38 12 56 16 Q72 12 78 28" stroke="#1ABC9C" strokeWidth="6" fill="none" strokeLinecap="round" />
        {/* Head */}
        <ellipse cx="50" cy="52" rx="36" ry="28" fill="#2ECC71" />
        {/* Snout */}
        <path d="M20 54 Q12 50 18 64 Q28 66 32 60" fill="#2ECC71" />

        {/* Big Rotating Chameleon Eye */}
        <circle cx="44" cy="48" r="14" fill="#F1C40F" stroke="#27AE60" strokeWidth="2.5" />
        <motion.circle
          cx="44"
          cy="48"
          r="5"
          fill="#2C3E50"
          animate={{ cx: [41, 47, 41], cy: [46, 50, 46] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <circle cx="43" cy="46" r="1.8" fill="#FFFFFF" />

        {/* Curled Tongue Smile */}
        <path d="M22 60 Q32 66 40 60" stroke="#E74C3C" strokeWidth="3" strokeLinecap="round" fill="none" />
      </svg>
    </motion.div>
  );
};

export const MASCOTS_LIST: { id: MascotId; name: string; title: string; quote: string; color: string }[] = [
  {
    id: 'pippin',
    name: 'Pippin',
    title: 'Sprout of Wonder',
    quote: 'Every puzzle helps your bright brain sprout a new leaf!',
    color: '#38B07D',
  },
  {
    id: 'barnaby',
    name: 'Barnaby',
    title: 'Honey Bear',
    quote: 'Slow and steady solves the maze! Take sweet time.',
    color: '#D38A4A',
  },
  {
    id: 'nova',
    name: 'Nova',
    title: 'Star-Fox',
    quote: 'Quick eyes and clever paws! Let us chase the highest score!',
    color: '#F39C12',
  },
  {
    id: 'luna',
    name: 'Luna',
    title: 'Zen Owl',
    quote: 'Quiet your breath, feel the stillness, and the answer will shine.',
    color: '#9B59B6',
  },
  {
    id: 'dexter',
    name: 'Dexter',
    title: 'Robo-Tinkerer',
    quote: 'Logic circuit initialized! Let us compute the hardest rules!',
    color: '#3CA2FF',
  },
  {
    id: 'cleo',
    name: 'Cleo',
    title: 'Chameleon',
    quote: 'Colors and shapes shift all around! Keep your eyes sharp!',
    color: '#2ECC71',
  },
];
