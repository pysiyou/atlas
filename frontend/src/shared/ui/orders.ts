/** Order/test status and rejection type → badge color */
import type { BadgeColor } from './types';

export const ORDER_COLOR_MAP: Record<string, BadgeColor> = {
  ordered: 'info',
  'in-progress': 'warning',
  completed: 'success',
  cancelled: 'danger',
  validated: 'success',
  rejected: 'danger',
  escalated: 'warning',
  superseded: 'muted',
  resulted: 'success',
  removed: 'muted',
  're-test': 'warning',
  're-collect': 'primary',
  authorize_retest: 'success',
};
