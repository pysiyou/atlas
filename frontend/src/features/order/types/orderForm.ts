/**
 * Shared types for order create/edit form
 */

import type { PriorityLevel } from '@/types';

export interface OrderFormData {
  referringPhysician: string;
  priority: PriorityLevel;
  clinicalNotes: string;
  selectedTests: string[];
}
