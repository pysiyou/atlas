// src/components/loaders/SpinnerLoader.tsx
/**
 * SpinnerLoader – Animated DNA double-helix loading indicator.
 *
 * Each "rung" is a thin bar that rotates around the X-axis with a
 * staggered delay, creating a travelling 3D helix wave. Coloured dots sit
 * at each end to represent the two strands. The whole assembly is tilted
 * Displayed horizontally (no Z-axis tilt).
 *
 * Pure CSS 3D transforms · compositor-only animation → locked 60 fps.
 */

import React, { useId, useEffect } from 'react';


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

/**
 * Module-level singleton: tracks which keyframe sheets have already been
 * injected into the document so we never inject the same @keyframes twice,
 * even when many SpinnerLoader instances are mounted simultaneously.
 */
const _injectedIds = new Set<string>();

function ensureStyleSheet(id: string): void {
  if (_injectedIds.has(id)) return;
  _injectedIds.add(id);
  const style = document.createElement('style');
  style.dataset.dnaId = id;
  style.textContent = [
    `@keyframes ${id}R{0%{transform:rotateX(0deg)}100%{transform:rotateX(360deg)}}`,
    `@media(prefers-reduced-motion:reduce){[data-dna="${id}"] *{animation-play-state:paused!important}}`,
  ].join('');
  document.head.appendChild(style);
}

export type SpinnerLoaderSize = keyof typeof SIZES;
/** @deprecated Use SpinnerLoaderSize */
export type DnaHelixLoaderSize = SpinnerLoaderSize;

export interface SpinnerLoaderProps {
  size?: SpinnerLoaderSize;
  className?: string;
}
/** @deprecated Use SpinnerLoaderProps */
export type DnaHelixLoaderProps = SpinnerLoaderProps;

const rootStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  transformStyle: 'preserve-3d',
  transform: 'rotateZ(0deg)',
};

/**
 * SpinnerLoader
 *
 * Renders a DNA double-helix animation. Styles are injected once per unique
 * animation ID into the document head — not duplicated per instance.
 */
export const SpinnerLoader: React.FC<SpinnerLoaderProps> = ({ size = 'md', className = '' }) => {
  const rawId = useId();
  const id = `dna${rawId.replace(/:/g, '')}`;
  const { b: barCount, d, h, g, l } = SIZES[size] ?? SIZES.md;
  const timing = `${PERIOD}s linear infinite`;

  // Inject keyframe CSS once per unique id — never duplicated across instances.
  useEffect(() => {
    ensureStyleSheet(id);
  }, [id]);

  const bars = Array.from({ length: barCount }, (_, i) => {
    const delay = `-${(i * DELAY_STEP).toFixed(2)}s`;
    return (
      <div
        key={i}
        style={{
          position: 'relative',
          width: l,
          height: h,
          border: `${l}px solid var(--dna-helix-connector)`,
          background: 'transparent',
          margin: `0 ${g}px`,
          animation: `${id}R ${timing}`,
          animationDelay: delay,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            marginLeft: -d / 2,
            width: d,
            height: d,
            backgroundColor: 'var(--dna-helix-primary-node)',
            borderRadius: '50%',
            boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
            top: -d / 2,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            marginLeft: -d / 2,
            width: d,
            height: d,
            backgroundColor: 'var(--dna-helix-secondary-node)',
            borderRadius: '50%',
            boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
            bottom: -d / 2,
          }}
        />
      </div>
    );
  });

  return (
    <div
      role="status"
      aria-label="Loading"
      data-dna={id}
      className={className}
      style={rootStyle}
    >
      {bars}
    </div>
  );
};

/** @deprecated Use SpinnerLoader */
export const DnaHelixLoader = SpinnerLoader;
