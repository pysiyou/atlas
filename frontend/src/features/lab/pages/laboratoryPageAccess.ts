import type { UserRole } from '@/types';
import type { LabTabId } from '../constants/labConstants';

const LAB_TECH_ROLES: UserRole[] = ['administrator', 'lab-technician', 'lab-technician-plus'];
const COLLECTION_ROLES: UserRole[] = [
  'administrator',
  'receptionist',
  'lab-technician',
  'lab-technician-plus',
];

export function tabAllowed(
  tab: LabTabId,
  hasRole: (roles: UserRole | UserRole[]) => boolean
): boolean {
  if (tab === 'collection') return hasRole(COLLECTION_ROLES);
  if (tab === 'monitor') return hasRole(LAB_TECH_ROLES);
  return hasRole(LAB_TECH_ROLES);
}
