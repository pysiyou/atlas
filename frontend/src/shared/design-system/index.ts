/**
 * Design System
 *
 * Centralized design tokens and utilities.
 */

// Legacy constants (deprecated - use tokens instead)
export * from './constants';

// New token system
export * from './tokens';
export * from './tokens/components';

// Re-export tokens object for convenience
export { tokens } from './tokens';
