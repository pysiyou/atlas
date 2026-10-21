/** Shared motion for sidebar width + label fade. */
export const SIDEBAR_MOTION = {
  width: {
    type: 'spring' as const,
    stiffness: 420,
    damping: 36,
    mass: 0.85,
  },
  label: {
    duration: 0.22,
    ease: [0.4, 0, 0.2, 1] as const,
  },
} as const;
