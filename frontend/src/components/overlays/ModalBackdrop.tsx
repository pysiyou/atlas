/**
 * Modal backdrop with blur and fade animation.
 */

import React from 'react';
import { motion } from 'framer-motion';

export interface ModalBackdropProps {
  onClick?: () => void;
  zIndex?: number;
  opacity?: number;
  className?: string;
}

export const ModalBackdrop: React.FC<ModalBackdropProps> = ({
  onClick,
  zIndex = 40,
  opacity = 0.3,
  className = '',
}) => {
  const inlineStyle: React.CSSProperties = {
    zIndex,
    backgroundColor: 'var(--overlay)',
    backdropFilter: 'blur(2px)',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`fixed inset-0 ${className}`}
      style={{ ...inlineStyle, opacity }}
      onClick={onClick}
    />
  );
};
