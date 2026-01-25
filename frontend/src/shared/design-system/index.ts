/**
 * Design System
 *
 * Centralized design tokens and utilities.
 */

// Legacy constants (deprecated - use tokens instead)
export * from './constants';

// New token system - export core tokens
export * from './tokens';

// Export component tokens - explicitly export to avoid label conflict
export {
  getButtonVariant,
  getButtonSize,
  getButtonClasses,
  buttonBase,
  buttonVariants,
  buttonSizes,
  iconButtonVariants,
} from './tokens/components/button';
export {
  getInputClasses,
  inputBase,
  inputPadding,
  inputBorder,
  inputText,
  inputFocus,
  label as inputLabel,
  errorMessage,
  requiredIndicator,
  helperText,
  inputContainer,
} from './tokens/components/input';
export * from './tokens/components/badge';
export * from './tokens/components/alert';
export * from './tokens/components/card';
export * from './tokens/components/modal';
export * from './tokens/components/tabs';
export * from './tokens/components/layout';
export * from './tokens/components/table';
export * from './tokens/components/shared';

// Re-export tokens object for convenience
export { tokens } from './tokens';
