/**
 * Layout Composition Tokens
 * 
 * Common layout patterns used across components.
 * Reduces repetition of flexbox/grid patterns.
 */

import { sectionStyles } from './section';
import { gap } from '../spacing';

/**
 * Layout Patterns
 * Reusable layout compositions for common UI patterns
 */
export const layoutPatterns = {
  formSection: `${sectionStyles.container.base} ${sectionStyles.container.spacing}`,
  formSectionCompact: `${sectionStyles.container.compact} ${sectionStyles.container.spacingCompact}`,
  iconWithLabel: 'flex items-start gap-3',
  twoColumnGrid: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  threeColumnGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
  flexRow: 'flex items-center gap-3',
  flexRowBetween: 'flex items-center justify-between gap-3',
  flexCol: 'flex flex-col gap-4',
  flexColCompact: 'flex flex-col gap-2',
} as const;
