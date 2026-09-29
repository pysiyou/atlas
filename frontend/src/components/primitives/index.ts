/**
 * primitives/index.ts — Atomic, presentation-only building blocks.
 * Badge (+ TagChip, RemovableTag, FilterChip): ./Badge.tsx; colors in ./badgeStyles.ts.
 * InlineHighlight: ./InlineHighlight.tsx; layout/wash in theme recipes `INLINE_HIGHLIGHT`.
 * Button + IconButton: ./Button.tsx (single module).
 */

export * from './Badge';
export { getColorStyles, resolveColor } from './badgeStyles';
export * from './Avatar';
export * from './Button';
export { actionButtonPreset, type ActionButtonPreset } from './buttonPresets';
export * from './Checkbox';
export * from './CheckboxList';
export * from './CircularProgress';
export * from './Icon';
export * from './InlineHighlight';
