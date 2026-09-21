import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
  color?: string;
  fill?: string;
}

export const StarIcon: React.FC<IconProps> = ({ size = 24, color = '#F5A623', fill = '#F5A623', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export const BrainIcon: React.FC<IconProps> = ({ size = 28, color = '#FF6565', fill = 'none', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04Z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04Z" />
  </svg>
);

export const ZenLotusIcon: React.FC<IconProps> = ({ size = 28, color = '#38B07D', fill = 'none', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 3c1.5 3 4 6 4 9a4 4 0 0 1-8 0c0-3 2.5-6 4-9z" fill={fill || '#E8F8F0'} />
    <path d="M6 12c-2.5-1-4 1-4 3 0 3 4 5 7 5" />
    <path d="M18 12c2.5-1 4 1 4 3 0 3-4 5-7 5" />
  </svg>
);

export const CheckBadgeIcon: React.FC<IconProps> = ({ size = 24, color = '#38B07D', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" fill="#E8F8F0" stroke={color} strokeWidth="2" />
    <path d="M8 12.5l2.5 2.5 5.5-5.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CrossBadgeIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6565', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" fill="#FFF0F0" stroke={color} strokeWidth="2" />
    <path d="M9 9l6 6M15 9l-6 6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const TrophyIcon: React.FC<IconProps> = ({ size = 28, color = '#F5A623', fill = '#FEF7E6', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 4h16v7a6 6 0 0 1-12 0V4Z" />
    <path d="M12 15v4" />
    <path d="M8 20h8" />
  </svg>
);

export const SparkleIcon: React.FC<IconProps> = ({ size = 24, color = '#F5A623', fill = '#F5A623', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
  </svg>
);
