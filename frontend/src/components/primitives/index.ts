/**
 * primitives/index.ts — Atomic, presentation-only building blocks.
 * Badge (+ TagChip, RemovableTag, FilterChip): ./Badge.tsx; colors in ./badgeStyles.ts.
 * Button + IconButton: ./Button.tsx (single module).
 */

export * from './Badge';
export { getColorStyles, resolveColor } from './badgeStyles';
export * from './Avatar';
export * from './Button';
export * from './Checkbox';
export * from './CheckboxList';
export * from './CircularProgress';
export * from './Icon';
