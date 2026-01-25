/**
 * Card Component Tokens
 * 
 * Unified card styling tokens ensuring all card components
 * (desktop and mobile) use consistent styling.
 */

import { neutralColors, stateColors } from '../colors';
import { padding, gap } from '../spacing';
import { radius, border } from '../borders';
import { shadow, shadowTransition } from '../shadows';

/**
 * Card Base Styles
 */
export const cardBase = {
  base: `${neutralColors.white} ${border.card} ${radius.card} ${shadow.card} ${shadowTransition.default}`,
  hover: 'hover:shadow-md',
  cursor: 'cursor-pointer',
} as const;

/**
 * Desktop Lab Card Styles
 * Used by: ValidationCard, CollectionCard, EntryCard (via LabCard)
 */
export const labCard = {
  wrapper: 'cursor-pointer',
  card: `${cardBase.base} ${padding.card.lg}`,
  gap: gap.card, // gap-3
  header: {
    container: 'flex items-start justify-between gap-3',
    badgeGroup: 'flex items-center gap-2.5 flex-wrap min-w-0 flex-1',
    actionGroup: 'flex items-center gap-2 shrink-0',
  },
  context: {
    container: 'flex items-center gap-2 text-xs text-gray-600',
    patientName: 'font-medium text-gray-900',
    separator: 'text-gray-400',
  },
  contentSection: {
    base: 'bg-gray-50 rounded p-3',
    title: 'text-xs font-medium text-gray-700 mb-2',
  },
  rejectionBorder: stateColors.rejection.borderLeft, // border-l-4 border-l-yellow-400
} as const;

/**
 * Mobile Card Styles
 * Used by: ValidationMobileCard, CollectionMobileCard, EntryMobileCard,
 *          PatientCard, PaymentCard, CatalogCard
 * 
 * All mobile cards MUST use these identical tokens
 */
export const mobileCard = {
  base: `${neutralColors.white} ${border.card} ${radius.card} ${padding.card.md} ${cardBase.cursor} ${cardBase.hover} ${shadowTransition.default} flex flex-col h-full`,
  header: {
    container: 'mb-3 pb-3 border-b border-gray-100',
    title: 'text-sm font-semibold text-gray-900 truncate',
  },
  content: {
    container: 'grow',
    text: 'text-xs text-gray-700',
    textSecondary: 'text-xs text-gray-500',
  },
  footer: {
    container: 'flex justify-between items-center mt-auto pt-3',
  },
} as const;

/**
 * Entity Card Styles
 * Used by: EntityCard (shared data display component)
 */
export const entityCard = {
  wrapper: 'cursor-pointer',
  card: `${cardBase.base} ${cardBase.hover} ${padding.card.lg}`,
  gap: gap.md, // gap-4
  header: {
    container: 'flex items-start justify-between gap-3',
    badgeGroup: 'flex items-center gap-2.5 flex-wrap min-w-0 flex-1',
    actionGroup: 'flex items-center gap-2 shrink-0',
  },
  context: {
    container: 'flex flex-col gap-1.5',
    primary: 'text-sm font-medium text-gray-900',
    secondary: 'text-xs text-gray-600',
  },
} as const;

/**
 * Helper function to get card classes
 */
export const getCardClasses = (type: 'lab' | 'mobile' | 'entity' = 'mobile'): string => {
  switch (type) {
    case 'lab':
      return labCard.card;
    case 'mobile':
      return mobileCard.base;
    case 'entity':
      return entityCard.card;
    default:
      return mobileCard.base;
  }
};
