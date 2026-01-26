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
    container: `flex items-center gap-2 text-xs ${neutralColors.text.tertiary}`,
    patientName: `font-medium ${neutralColors.text.primary}`,
    separator: `${neutralColors.text.disabled}`,
  },
  contentSection: {
    base: `bg-app-bg rounded p-3`,
    title: `text-xs font-medium ${neutralColors.text.secondary} mb-2`,
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
    container: `mb-3 pb-3 border-b ${neutralColors.border.default}`,
    title: `text-sm font-semibold ${neutralColors.text.primary} truncate`,
  },
  content: {
    container: 'grow',
    text: `text-xs ${neutralColors.text.secondary}`,
    textSecondary: `text-xs ${neutralColors.text.muted}`,
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
    primary: `text-sm font-medium ${neutralColors.text.primary}`,
    secondary: `text-xs ${neutralColors.text.tertiary}`,
  },
} as const;

/**
 * Empty State Card Styles
 * Used by: EmptyState component
 */
export const emptyStateCard = {
  container: 'h-full flex flex-col items-center justify-center text-center p-4',
  iconContainer: 'w-12 h-12 flex items-center justify-center mb-3',
  icon: `w-full h-full ${neutralColors.text.disabled}`,
  title: `text-sm font-medium ${neutralColors.text.muted}`,
  description: `text-xs ${neutralColors.text.muted} mt-1`,
  action: 'mt-4',
} as const;

/**
 * List View Card Styles
 * Used by: ListView component
 */
export const listViewCard = {
  container: `flex-1 flex flex-col bg-surface rounded border ${neutralColors.border.default} overflow-hidden min-h-0`,
  header: {
    title: `text-2xl font-bold ${neutralColors.text.primary}`,
    description: `text-sm ${neutralColors.text.muted} mt-1`,
  },
  content: 'p-4 overflow-y-auto h-full',
  grid: {
    container: 'p-4 overflow-y-auto h-full space-y-2',
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
