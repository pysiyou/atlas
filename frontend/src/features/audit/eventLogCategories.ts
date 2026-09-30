/**
 * Event log filter category options (aligned with backend categories.py).
 */
import type { EventLogCategoryKey } from './types';

export interface EventLogCategoryOption {
  id: EventLogCategoryKey;
  label: string;
  group?: string;
}

export const EVENT_LOG_CATEGORY_OPTIONS: EventLogCategoryOption[] = [
  { id: 'patient', label: 'Patient', group: 'Domain' },
  { id: 'order', label: 'Order', group: 'Domain' },
  { id: 'laboratory', label: 'Laboratory (all)', group: 'Domain' },
  { id: 'billing', label: 'Billing', group: 'Domain' },
  { id: 'reporting', label: 'Reporting', group: 'Domain' },
  { id: 'system', label: 'System', group: 'Domain' },
  { id: 'laboratory:sample', label: 'Sample', group: 'Laboratory' },
  { id: 'laboratory:result', label: 'Result', group: 'Laboratory' },
  { id: 'laboratory:validation', label: 'Validation', group: 'Laboratory' },
  { id: 'laboratory:escalation', label: 'Escalation', group: 'Laboratory' },
  { id: 'laboratory:quality', label: 'Quality', group: 'Laboratory' },
  { id: 'laboratory:analyzer', label: 'Analyzer', group: 'Laboratory' },
];

/** Maps category key to event_type prefix (dot-terminated). */
export function categoryToEventTypePrefix(category: EventLogCategoryKey): string {
  if (!category.includes(':')) {
    return `${category}.`;
  }
  const [, subdomain] = category.split(':', 2);
  return `laboratory.${subdomain}.`;
}
