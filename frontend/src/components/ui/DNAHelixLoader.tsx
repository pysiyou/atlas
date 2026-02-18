// src/shared/ui/DNAHelixLoader.tsx
/**
 * DnaHelixLoader – Animated DNA double-helix loading indicator.
 *
 * Each "rung" is a thin bar that rotates around the X-axis with a
 * staggered delay, creating a travelling 3D helix wave. Coloured dots sit
 * at each end to represent the two strands. The whole assembly is tilted
 * Displayed horizontally (no Z-axis tilt).
 *
 * Pure CSS 3D transforms · compositor-only animation → locked 60 fps.
 */

import React, { useId, useMemo } from 'react';

const PERIOD = 4.2;
const DELAY_STEP = 0.18;

interface Cfg {
  b: number;
  d: number;
  h: number;
  g: number;
  l: number;
}

const SIZES: Record<string, Cfg> = {
  xs: { b: 6, d: 2, h: 8, g: 1, l: 1 },
  sm: { b: 10, d: 4, h: 24, g: 2, l: 1 },
  md: { b: 14, d: 6, h: 36, g: 3, l: 1 },
  lg: { b: 18, d: 8, h: 50, g: 5, l: 1 },
};

function buildSheet(id: string): string {
  return [
    `@keyframes ${id}R{0%{transform:rotateX(0deg)}100%{transform:rotateX(360deg)}}`,
    `@media(prefers-reduced-motion:reduce){[data-dna="${id}"] *{animation-play-state:paused!important}}`,
  ].join('');
}

export type DnaHelixLoaderSize = keyof typeof SIZES;

export interface DnaHelixLoaderProps {
  size?: DnaHelixLoaderSize;
  className?: string;
}

const rootStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  transformStyle: 'preserve-3d',
  transform: 'rotateZ(0deg)',
};

export const DnaHelixLoader: React.FC<DnaHelixLoaderProps> = ({ size = 'md', className = '' }) => {
  const id = `dna${useId().replace(/:/g, '')}`;
  const { b: barCount, d, h, g, l } = SIZES[size] ?? SIZES.md;
  const css = useMemo(() => buildSheet(id), [id]);
  const timing = `${PERIOD}s linear infinite`;

  const bars = Array.from({ length: barCount }, (_, i) => {
    const delay = `-${(i * DELAY_STEP).toFixed(2)}s`;
    const barStyle: React.CSSProperties = {
      position: 'relative',
      width: l,
      height: h,
      border: `${l}px solid var(--dna-helix-connector)`,
      background: 'transparent',
      margin: `0 ${g}px`,
      animation: `${id}R ${timing}`,
      animationDelay: delay,
    };
    const nodeStyle: React.CSSProperties = {
      position: 'absolute',
      left: '50%',
      marginLeft: -d / 2,
      width: d,
      height: d,
      backgroundColor: 'var(--dna-helix-primary-node)',
      borderRadius: '50%',
      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    };
    const topNodeStyle = { ...nodeStyle, top: -d / 2 };
    const bottomNodeStyle: React.CSSProperties = { ...nodeStyle, bottom: -d / 2, backgroundColor: 'var(--dna-helix-secondary-node)' };

    return React.createElement(
      'div',
      { key: i, style: barStyle },
      React.createElement('div', { style: topNodeStyle }),
      React.createElement('div', { style: bottomNodeStyle })
    );
  });

  const childList: React.ReactNode[] = [
    React.createElement('style', { key: 'sheet' }, css),
    ...bars,
  ];
  return React.createElement('div', {
    role: 'status',
    'aria-label': 'Loading',
    'data-dna': id,
    className,
    style: rootStyle,
  }, childList);
};

