/**
 * Composition Helper Functions
 * 
 * Helper functions that return composed style classes for common patterns.
 * These reduce boilerplate and ensure consistency across components.
 */

import { cardBase } from '../tokens/components/card';
import { padding } from '../tokens/spacing';
import { heading } from '../tokens/typography';
import { neutralColors } from '../tokens/colors';
import { iconSizes } from '../tokens/sizing';
import { fontSize } from '../tokens/typography';
import { sectionStyles } from '../tokens/compositions/section';

/**
 * Get form section classes
 * Used for form sections with container, heading, and content spacing
 */
export const getFormSectionClasses = (variant: 'default' | 'compact' = 'default') => {
  return {
    container: variant === 'compact' 
      ? `${cardBase.base} ${padding.card.md}` 
      : `${cardBase.base} ${padding.card.lg}`,
    heading: sectionStyles.heading.h3,
    content: variant === 'compact' 
      ? sectionStyles.container.spacingCompact 
      : sectionStyles.container.spacing,
  };
};

/**
 * Get info field classes
 * Used for icon + label + value display patterns (e.g., PatientInfoSection)
 */
export const getInfoFieldClasses = () => {
  return {
    container: 'flex items-start gap-3',
    icon: `${iconSizes.md} ${neutralColors.text.disabled} mt-1`,
    label: `${fontSize.xs} ${neutralColors.text.tertiary} mb-1`,
    value: `font-medium ${neutralColors.text.primary}`,
    valueMono: `font-mono font-medium ${neutralColors.text.primary}`,
    secondaryText: `${fontSize.xs} ${neutralColors.text.muted} mt-1`,
  };
};

/**
 * Get section divider classes
 */
export const getSectionDividerClasses = (position: 'bottom' | 'top' = 'bottom') => {
  return position === 'top' 
    ? sectionStyles.dividerTop 
    : sectionStyles.divider;
};
