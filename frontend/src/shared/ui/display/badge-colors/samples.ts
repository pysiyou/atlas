/** Sample status → badge color */
import type { BadgeColor } from './types';

export const SAMPLE_COLOR_MAP: Record<string, BadgeColor> = {
  pending: 'neutral',
  collected: 'info',
  received: 'indigo',
  accessioned: 'purple',
  stored: 'neutral',
  disposed: 'muted',
  'sample-collected': 'info',
};
