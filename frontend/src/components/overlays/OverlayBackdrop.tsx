/**
 * Shared scrim for modals and popovers — single source for overlay color + blur.
 */

import { motion } from 'framer-motion';

/** Below panel (100); above app chrome (≤50). */
export const OVERLAY_BACKDROP_Z_INDEX = 99;
/** Modal / popover surface above scrim. */
export const OVERLAY_PANEL_Z_INDEX = 100;

interface OverlayBackdropProps {
  onClick?: () => void;
  zIndex?: number;
}

export function OverlayBackdrop({
  onClick,
  zIndex = OVERLAY_BACKDROP_Z_INDEX,
}: OverlayBackdropProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 cursor-default"
      style={{
        zIndex,
        backgroundColor: 'var(--overlay)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
      }}
      onClick={onClick}
      aria-hidden
    />
  );
}
