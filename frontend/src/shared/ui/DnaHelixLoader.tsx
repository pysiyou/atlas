// src/shared/ui/DnaHelixLoader.tsx
/**
 * DnaHelixLoader – Animated DNA double-helix loading indicator.
 *
 * Two strands (red primary, orange secondary) follow opposing sine waves
 * with per-pair phase offsets, creating a realistic twisting helix.
 * Depth is conveyed through scale + opacity (compositor-friendly, 60 fps).
 * Teal connectors dynamically stretch between strand endpoints.
 *
 * Implementation: Pure CSS @keyframes with 16-step sine tables – no JS
 * animation runtime. All animated properties (transform, opacity) are
 * GPU-composited. z-index toggles handle strand-crossover layering.
 */

import React, { useId, useMemo } from 'react';

/* ═══════════════════════════════════════════════════════════════════════
   TUNING
   ═══════════════════════════════════════════════════════════════════════ */

const PAIR_COUNT = 10;
const PERIOD = 2.2; // seconds per full rotation
const TWISTS = 1.5; // visible wavelengths across the width

// Depth-perception range
const SCALE_FRONT = 1.3;
const SCALE_BACK = 0.35;
const OP_FRONT = 1;
const OP_BACK = 0.28;

/* ═══════════════════════════════════════════════════════════════════════
   PRE-COMPUTED SINE TABLE (16 steps → buttery-smooth curve)
   ═══════════════════════════════════════════════════════════════════════ */

const K = 16;
const _a = Array.from({ length: K + 1 }, (_, i) => (i / K) * Math.PI * 2);
const _sin = _a.map(Math.sin);
const _cos = _a.map(Math.cos);
const _pct = Array.from({ length: K + 1 }, (_, i) =>
  +((i / K) * 100).toFixed(3),
);

/* ═══════════════════════════════════════════════════════════════════════
   SIZE PRESETS
   d = dot diameter, a = amplitude, g = gap, l = line width
   ═══════════════════════════════════════════════════════════════════════ */

interface Cfg {
  d: number;
  a: number;
  g: number;
  l: number;
}

const SIZES: Record<string, Cfg> = {
  xs: { d: 5, a: 7, g: 2, l: 1 },
  sm: { d: 8, a: 11, g: 3, l: 1.5 },
  md: { d: 12, a: 17, g: 5, l: 2 },
  lg: { d: 17, a: 25, g: 8, l: 2.5 },
};

/* ═══════════════════════════════════════════════════════════════════════
   COLORS (CSS variable → hardcoded fallback)
   ═══════════════════════════════════════════════════════════════════════ */

const DNA_HELIX_COLORS = {
  primaryNode: 'var(--primitive-danger-500, #E8595C)',
  secondaryNode: 'var(--primitive-orange-500, #E2873D)',
  connector: 'var(--primitive-teal-500, #3B9DAB)',
} as const;

/* ═══════════════════════════════════════════════════════════════════════
   CSS KEYFRAME BUILDER
   ═══════════════════════════════════════════════════════════════════════ */

const lrp = (lo: number, hi: number, t: number) => lo + (hi - lo) * t;

function buildSheet(id: string, amp: number): string {
  // Strand keyframe: maps sine/cosine to translateY + scale + opacity + z
  const strand = (inv: boolean) => {
    let f = '';
    for (let i = 0; i <= K; i++) {
      const c = inv ? -_cos[i] : _cos[i]; // depth factor
      const t = (c + 1) / 2; // 0 = back, 1 = front
      const y = ((inv ? 1 : -1) * _sin[i] * amp).toFixed(2);
      const s = lrp(SCALE_BACK, SCALE_FRONT, t).toFixed(3);
      const o = lrp(OP_BACK, OP_FRONT, t).toFixed(3);
      const z = c > 0.05 ? 3 : c < -0.05 ? 1 : 2;
      f += `${_pct[i]}%{transform:translateY(${y}px) scale(${s});opacity:${o};z-index:${z}}`;
    }
    return f;
  };

  // Connector keyframe: scaleY tracks |sin| (stretch between dots)
  let cf = '';
  for (let i = 0; i <= K; i++) {
    const as = Math.abs(_sin[i]);
    const sy = (as * 0.85 + 0.15).toFixed(3); // min 15 % visible
    const co = (0.15 + 0.6 * as).toFixed(3); // opacity ramp
    cf += `${_pct[i]}%{transform:scaleY(${sy});opacity:${co}}`;
  }

  return [
    `@keyframes ${id}A{${strand(false)}}`,
    `@keyframes ${id}B{${strand(true)}}`,
    `@keyframes ${id}C{${cf}}`,
    // Freeze at current phase for users who prefer reduced motion
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
  const { d, a, g, l } = SIZES[size] ?? SIZES.md;
  const pri = color ?? primaryNodeColor;
  const sec = color ?? secondaryNodeColor;
  const lin = color ?? connectorColor;

  const css = useMemo(() => buildSheet(id, a), [id, a]);

  const w = PAIR_COUNT * d + (PAIR_COUNT - 1) * g;
  const h = Math.ceil((a + (d * SCALE_FRONT) / 2) * 2) + 4;
  const step = (PERIOD * TWISTS) / PAIR_COUNT;
  const timing = `${PERIOD}s linear infinite`;

  return (
    <div
      role="status"
      aria-label="Loading"
      data-dna={id}
      className={className}
      style={{
        position: 'relative',
        width: w,
        height: h,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: g,
      }}
    >
      <style>{css}</style>

      {Array.from({ length: PAIR_COUNT }, (_, i) => {
        // Negative delay → every pair starts already in-phase (no staggered pop-in)
        const del = `-${(i * step).toFixed(3)}s`;

        return (
          <div
            key={i}
            style={{ position: 'relative', width: d, height: h, flexShrink: 0 }}
          >
            {/* ── connector ── */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: l,
                height: a * 2,
                marginLeft: -l / 2,
                marginTop: -a,
                backgroundColor: lin,
                borderRadius: l,
                transformOrigin: 'center',
                animation: `${id}C ${timing}`,
                animationDelay: del,
                zIndex: 2,
                willChange: 'transform, opacity',
              }}
            />

            {/* ── strand A (primary / red-coral) ── */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: d,
                height: d,
                marginLeft: -d / 2,
                marginTop: -d / 2,
                borderRadius: '50%',
                backgroundColor: pri,
                animation: `${id}A ${timing}`,
                animationDelay: del,
                willChange: 'transform, opacity',
              }}
            />

            {/* ── strand B (secondary / orange-amber) ── */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: d,
                height: d,
                marginLeft: -d / 2,
                marginTop: -d / 2,
                borderRadius: '50%',
                backgroundColor: sec,
                animation: `${id}B ${timing}`,
                animationDelay: del,
                willChange: 'transform, opacity',
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
