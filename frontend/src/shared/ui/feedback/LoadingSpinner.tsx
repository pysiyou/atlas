import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export type ClaudeLoaderSize = 'sm' | 'md' | 'lg';

export interface ClaudeLoaderProps {
  size?: ClaudeLoaderSize;
  color?: string;
  armCount?: number;
}

const SIZE_MAP: Record<ClaudeLoaderSize, number> = {
  sm: 32,
  md: 64,
  lg: 96,
};

/**
 * Seeded random number generator for deterministic "random" values
 * Uses a simple linear congruential generator (LCG)
 */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

// Fixed seed for deterministic appearance - defined outside component
const LOADER_SEED = 42;

export const ClaudeLoader: React.FC<ClaudeLoaderProps> = ({
  size = 'md',
  color = 'var(--feedback-success-text)',
  armCount = 12,
}) => {
  const pixelSize = SIZE_MAP[size];

  const armConfigs = useMemo(() => {
    const baseWidth = pixelSize * 0.08;
    const armLength = pixelSize * 0.35;
    const random = seededRandom(LOADER_SEED);

    return Array.from({ length: armCount }, (_, i) => {
      const angle = (i * 360) / armCount;
      const delay = (i / armCount) * 0.8 + random() * 0.6;
      const duration = 1.2 + random() * 1.2;

      // Varying widths create natural center intersection
      const widthVariation = random();
      const armWidth =
        widthVariation < 0.3
          ? baseWidth * (0.4 + random() * 0.4)
          : baseWidth * (0.8 + random() * 0.8);

      return { angle, delay, duration, armWidth, armLength };
    });
  }, [armCount, pixelSize]);

  const centerX = pixelSize / 2;
  const centerY = pixelSize / 2;

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox={`0 0 ${pixelSize} ${pixelSize}`}
      className="claude-loader"
      aria-hidden="true"
    >
      <g transform={`translate(${centerX}, ${centerY})`}>
        {armConfigs.map((config, index) => {
          const halfWidth = config.armWidth / 2;
          const baseLength = config.armLength;
          const minLength = baseLength * 0.7;
          const maxLength = baseLength * 1.05;

          return (
            <motion.rect
              key={index}
              x={-halfWidth}
              y={0}
              width={config.armWidth}
              rx={halfWidth}
              ry={halfWidth}
              fill={color}
              transform={`rotate(${config.angle})`}
              initial={{ height: maxLength }}
              animate={{ height: [maxLength, minLength, maxLength] }}
              transition={{
                duration: config.duration,
                delay: config.delay,
                repeat: Infinity,
                ease: [0.45, 0.05, 0.55, 0.95],
                times: [0, 0.5, 1],
              }}
            />
          );
        })}
      </g>
    </svg>
  );
};
