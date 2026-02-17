// src/shared/ui/DnaHelixLoader.tsx
/**
 * DnaHelixLoader – Animated DNA double-helix loading indicator.
 *
 * Each "rung" is a thin dotted bar that rotates around the X-axis with a
 * staggered delay, creating a travelling 3D helix wave. Coloured dots sit
 * at each end to represent the two strands. The whole assembly is tilted
 * Displayed horizontally (no Z-axis tilt).
 *
 * Pure CSS 3D transforms · compositor-only animation → locked 60 fps.
 */

import React, { useId, useMemo } from 'react';

/* ═══════════════════════════════════════════════════════════════════════
   TUNING
   ═══════════════════════════════════════════════════════════════════════ */

const BAR_COUNT = 16;
const PERIOD = 3; // seconds per full rotation
const DELAY_STEP = 0.15; // seconds between each bar

/* ═══════════════════════════════════════════════════════════════════════
   SIZE PRESETS
   d = dot diameter   h = bar height   g = margin per side   l = line width
   ═══════════════════════════════════════════════════════════════════════ */

interface Cfg {
  d: number;
  h: number;
  g: number;
  l: number;
}

const SIZES: Record<string, Cfg> = {
  xs: { d: 4, h: 24, g: 2, l: 1 },
  sm: { d: 6, h: 36, g: 3, l: 1 },
  md: { d: 8, h: 50, g: 5, l: 1 },
  lg: { d: 10, h: 70, g: 7, l: 1 },
};

/* ═══════════════════════════════════════════════════════════════════════
   COLORS (CSS variable with hardcoded fallback)
   ═══════════════════════════════════════════════════════════════════════ */

const DNA_HELIX_COLORS = {
  primaryNode: 'var(--primitive-danger-500, #E8595C)',
  secondaryNode: 'var(--primitive-orange-500, #E2873D)',
  connector: 'var(--primitive-teal-500, #3B9DAB)',
} as const;

/* ═══════════════════════════════════════════════════════════════════════
   CSS KEYFRAME BUILDER
   ═══════════════════════════════════════════════════════════════════════ */

function buildSheet(id: string): string {
  return [
    `@keyframes ${id}R{0%{transform:rotateX(0deg)}100%{transform:rotateX(360deg)}}`,
    `@media(prefers-reduced-motion:reduce){[data-dna="${id}"] *{animation-play-state:paused!important}}`,
  ].join('');
}

/* ═══════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */

export type DnaHelixLoaderSize = keyof typeof SIZES;

export interface DnaHelixLoaderProps {
  size?: DnaHelixLoaderSize;
  className?: string;
  /** Override all node/connector colours (e.g. currentColor). */
  color?: string;
  primaryNodeColor?: string;
  secondaryNodeColor?: string;
  connectorColor?: string;
}

export const DnaHelixLoader: React.FC<DnaHelixLoaderProps> = ({
  size = 'md',
  className = '',
  color,
  primaryNodeColor = DNA_HELIX_COLORS.primaryNode,
  secondaryNodeColor = DNA_HELIX_COLORS.secondaryNode,
  connectorColor = DNA_HELIX_COLORS.connector,
}) => {
  const id = 'dna' + useId().replace(/:/g, '');
  const { d, h, g, l } = SIZES[size] ?? SIZES.md;
  const pri = color ?? primaryNodeColor;
  const sec = color ?? secondaryNodeColor;
  const lin = color ?? connectorColor;

  const css = useMemo(() => buildSheet(id), [id]);

  const timing = `${PERIOD}s linear infinite`;

  return (
    <div
      role="status"
      aria-label="Loading"
      data-dna={id}
      className={className}
      style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transformStyle: 'preserve-3d',
        transform: 'rotateZ(0deg)',
      }}
    >
      <style>{css}</style>

      {Array.from({ length: BAR_COUNT }, (_, i) => {
        const del = `-${(i * DELAY_STEP).toFixed(2)}s`;

        return (
          <div
            key={i}
            style={{
              position: 'relative',
              width: l,
              height: h,
              border: `${l}px dotted ${lin}`,
              boxShadow: `0 0 ${Math.round(h * 0.15)}px ${lin}`,
              background: 'transparent',
              margin: `0 ${g}px`,
              animation: `${id}R ${timing}`,
              animationDelay: del,
            }}
          >
            {/* ── Top dot (primary / red) ── */}
            <div
              style={{
                position: 'absolute',
                top: -d / 2,
                left: '50%',
                marginLeft: -d / 2,
                width: d,
                height: d,
                backgroundColor: pri,
                borderRadius: '50%',
                boxShadow: `0 0 ${Math.round(d * 1.5)}px ${pri}`,
              }}
            />

            {/* ── Bottom dot (secondary / orange) ── */}
            <div
              style={{
                position: 'absolute',
                bottom: -d / 2,
                left: '50%',
                marginLeft: -d / 2,
                width: d,
                height: d,
                backgroundColor: sec,
                borderRadius: '50%',
                boxShadow: `0 0 ${Math.round(d * 1.2)}px ${sec}`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
