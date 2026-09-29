/**
 * Inline highlight color and appearance (pairs with geometry in recipes INLINE_HIGHLIGHT).
 * Multi-line wrapping is handled by INLINE_HIGHLIGHT root layout (inline + box-decoration-clone),
 * not by Badge-style nowrap chips.
 */

import { getColorStyles, resolveColor } from './badgeStyles';
import type { BadgeColor, BadgeVariant } from './badgeTypes';

export type { BadgeColor } from './badgeTypes';

/** Same vocabulary as Badge variants (palette + default). */
export type InlineHighlightVariant = BadgeVariant;

export function resolveInlineHighlightVariant(variant: string): BadgeColor {
  return resolveColor(variant);
}

export interface InlineHighlightStyleClasses {
  /** Text / tinted fill from badge palette */
  colorClass: string;
  /** Unified appearance neutral chip surface */
  surfaceClass: string;
}

/** Color + surface classes for an inline highlight chip. */
export function getInlineHighlightStyles(
  variant: InlineHighlightVariant,
  appearance: 'unified' | 'tinted',
): InlineHighlightStyleClasses {
  const color = resolveInlineHighlightVariant(String(variant));
  const { className: colorClass } = getColorStyles(color, appearance);
  return {
    colorClass,
    surfaceClass: appearance === 'unified' ? 'bg-badge' : '',
  };
}
