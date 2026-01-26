/**
 * Section Composition Tokens
 * 
 * Higher-level composition tokens for common section patterns.
 * Reduces repetition and ensures consistency across form sections.
 */

import { cardBase } from '../components/card';
import { padding } from '../spacing';
import { radius } from '../borders';
import { heading } from '../typography';
import { neutralColors } from '../colors';
import { border } from '../borders';

/**
 * Section Container Styles
 * Used for form sections, card containers, etc.
 */
export const sectionStyles = {
  container: {
    base: `${cardBase.base} ${padding.card.lg}`,
    compact: `${cardBase.base} ${padding.card.md}`,
    rounded: radius.card,
    spacing: 'space-y-4',
    spacingCompact: 'space-y-3',
  },
  heading: {
    h3: `${heading.h3} ${neutralColors.text.primary} mb-4`,
    h4: `${heading.h4} ${neutralColors.text.secondary} mb-3`,
    h5: `${heading.h5} ${neutralColors.text.secondary} mb-2`,
  },
  divider: `border-b ${border.divider}`,
  dividerTop: `mt-4 pt-4 border-t ${border.default}`,
} as const;
