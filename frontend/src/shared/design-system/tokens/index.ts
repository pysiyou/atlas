/**
 * Design Token System - Main Export
 *
 * Centralized design tokens for consistent styling across the application.
 * All tokens are organized by category for easy access.
 */

export * from './colors';
export * from './spacing';
export * from './typography';
export * from './borders';
export * from './shadows';
export * from './interactions';
export * from './animations';
export * from './sizing';

// Re-export for convenience
import { semanticColors, stateColors, brandColors, neutralColors, authColors } from './colors';
import { padding, margin, gap, spaceBetween } from './spacing';
import { heading, body, label, code, cardTitle, sectionTitle, helper, error, required } from './typography';
import { radius, width, color, border } from './borders';
import { shadow, shadowTransition } from './shadows';
import { interactionStates } from './interactions';
import { animationTokens } from './animations';
import { sizingTokens } from './sizing';

/**
 * Complete token object for easy access
 */
export const tokens = {
  colors: {
    semantic: semanticColors,
    state: stateColors,
    brand: brandColors,
    neutral: neutralColors,
    auth: authColors,
  },
  spacing: {
    padding,
    margin,
    gap,
    spaceBetween,
  },
  typography: {
    heading,
    body,
    label,
    code,
    cardTitle,
    sectionTitle,
    helper,
    error,
    required,
  },
  borders: {
    radius,
    width,
    color,
    border,
  },
  shadows: {
    shadow,
    shadowTransition,
  },
  interactions: interactionStates,
  animations: animationTokens,
  sizing: sizingTokens,
} as const;
