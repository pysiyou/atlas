import type { LabTabId } from '../constants/labConstants';
import { normalizeLabTabParam } from '../constants/labConstants';
import type { UserRole } from '@/types';

type LabHomeCounts = {
  collection: number;
  entry: number;
  validation: number;
  supervisor: number;
};

/** Roles that see lab workflow queues, monitor, and analyzer activity. */
export const LAB_TECH_ROLES: UserRole[] = [
  'administrator',
  'lab-technician',
  'lab-technician-plus',
];

/** Roles that may approve (release) results, resolve escalations, and call criticals. */
export const LAB_VALIDATOR_ROLES: UserRole[] = ['administrator', 'lab-technician-plus'];

const COLLECTION_ROLES: UserRole[] = [
  'administrator',
  'receptionist',
  'lab-technician',
  'lab-technician-plus',
];

const QUEUE_HOME_TABS: LabTabId[] = ['collection', 'entry', 'validation'];

export function tabAllowed(
  tab: LabTabId,
  hasRole: (roles: UserRole | UserRole[]) => boolean
): boolean {
  if (tab === 'collection') return hasRole(COLLECTION_ROLES);
  if (tab === 'monitor') return hasRole(LAB_TECH_ROLES);
  return hasRole(LAB_TECH_ROLES);
}

export function canReleaseResults(hasRole: (roles: UserRole | UserRole[]) => boolean): boolean {
  return hasRole(LAB_VALIDATOR_ROLES);
}

/** Bench techs land on a work queue; seniors land on Monitor. */
export function usesQueueHomeTab(hasRole: (roles: UserRole | UserRole[]) => boolean): boolean {
  return hasRole('lab-technician') && !hasRole(LAB_VALIDATOR_ROLES);
}

export function defaultLabTabForUser(
  hasRole: (roles: UserRole | UserRole[]) => boolean,
  options?: { suggestedTab?: string | null; counts?: LabHomeCounts }
): LabTabId {
  if (hasRole('receptionist') && !hasRole(LAB_TECH_ROLES)) {
    return 'collection';
  }
  if (!usesQueueHomeTab(hasRole)) {
    return 'monitor';
  }

  const suggested = normalizeLabTabParam(options?.suggestedTab ?? undefined);
  if (suggested && suggested !== 'monitor' && tabAllowed(suggested, hasRole)) {
    return suggested;
  }

  const counts = options?.counts;
  if (counts) {
    if (counts.collection > 0) return 'collection';
    if (counts.entry > 0) return 'entry';
    if (counts.validation + counts.supervisor > 0) return 'validation';
  }

  return QUEUE_HOME_TABS[0];
}
