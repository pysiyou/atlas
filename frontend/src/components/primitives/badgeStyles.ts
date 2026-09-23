/**
 * Badge color maps, labels, and appearance helpers.
 */

import { TONE } from '@/components/theme/recipes';
import { resolveStatusBadgeColor } from '@/utils/statusBadge';
import type { BadgeColor } from './badgeTypes';

export type { BadgeColor, BadgeVariant } from './badgeTypes';

const UNIFIED_STYLES: Record<BadgeColor, { text: string; dot: string }> = {
  neutral: { text: TONE.neutral.fgEmphasis, dot: TONE.neutral.fill },
  primary: { text: 'text-brand-fg', dot: TONE.brand.fill },
  success: { text: TONE.success.fgEmphasis, dot: TONE.success.fill },
  warning: { text: TONE.warning.fgEmphasis, dot: TONE.warning.fill },
  danger: { text: TONE.danger.fgEmphasis, dot: TONE.danger.fill },
  info: { text: TONE.info.fgEmphasis, dot: TONE.info.fill },
  purple: { text: 'text-purple-fg-emphasis', dot: 'bg-purple-fg-emphasis' },
  pink: { text: 'text-pink-fg-emphasis', dot: 'bg-pink-fg-emphasis' },
  teal: { text: 'text-teal-fg-emphasis', dot: 'bg-teal-fg-emphasis' },
  orange: { text: 'text-orange-fg-emphasis', dot: 'bg-orange-fg-emphasis' },
  indigo: { text: 'text-indigo-fg-emphasis', dot: 'bg-indigo-fg-emphasis' },
  cyan: { text: 'text-cyan-fg-emphasis', dot: 'bg-cyan-fg-emphasis' },
  muted: { text: 'text-text-tertiary', dot: 'bg-text-muted' },
};

const TINTED_STYLES: Record<BadgeColor, string> = {
  neutral: 'bg-border-default text-text-primary',
  primary: 'bg-brand text-on-brand',
  success: 'bg-success-bg-emphasis text-success-fg-emphasis',
  warning: 'bg-warning-bg-emphasis text-warning-fg-emphasis',
  danger: 'bg-danger-bg-emphasis text-danger-fg-emphasis',
  info: 'bg-info-bg text-info-fg-emphasis',
  purple: 'bg-purple-bg-emphasis text-purple-fg-emphasis',
  pink: 'bg-pink-bg-emphasis text-pink-fg-emphasis',
  teal: 'bg-teal-bg-emphasis text-teal-fg-emphasis',
  orange: 'bg-orange-bg-emphasis text-orange-fg-emphasis',
  indigo: 'bg-indigo-bg-emphasis text-indigo-fg-emphasis',
  cyan: 'bg-cyan-bg-emphasis text-cyan-fg-emphasis',
  muted: 'bg-border-default text-text-tertiary',
};

export const CONTAINER_STYLES: Record<string, string> = {
  'container-red': 'bg-container-red-bg text-container-red-text',
  'container-yellow': 'bg-container-yellow-bg text-container-yellow-text',
  'container-purple': 'bg-container-purple-bg text-container-purple-text',
  'container-blue': 'bg-container-blue-bg text-container-blue-text',
  'container-green': 'bg-container-green-bg text-container-green-text',
  'container-gray': 'bg-container-gray-bg text-container-gray-text',
  'container-black': 'bg-container-black-bg text-container-black-text',
};

/** Unified = neutral surface + colored text; tinted = filled chip. */
export function getColorStyles(color: BadgeColor, appearance: 'unified' | 'tinted') {
  if (appearance === 'tinted') {
    return { className: TINTED_STYLES[color], dotClassName: '' };
  }
  const u = UNIFIED_STYLES[color];
  return { className: u.text, dotClassName: u.dot };
}

export function resolveColor(variant: string): BadgeColor {
  return resolveStatusBadgeColor(variant);
}
