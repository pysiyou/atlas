/**
 * Event log kind options — six eventType roots plus laboratory subcategory tree.
 */
import type { EventLogKind } from './types';

export interface EventLogKindOption {
  id: EventLogKind;
  label: string;
}

/** Roots first, then laboratory subtree (including empty Quality until a QC product exists). */
export const EVENT_LOG_KIND_OPTIONS: EventLogKindOption[] = [
  { id: 'patient', label: 'Patient' },
  { id: 'order', label: 'Order' },
  { id: 'laboratory', label: 'Laboratory' },
  { id: 'laboratory:sample', label: 'Laboratory · Sample' },
  { id: 'laboratory:result', label: 'Laboratory · Results' },
  { id: 'laboratory:validation', label: 'Laboratory · Validation' },
  { id: 'laboratory:escalation', label: 'Laboratory · Escalation' },
  { id: 'laboratory:quality', label: 'Laboratory · Quality' },
  { id: 'laboratory:analyzer', label: 'Laboratory · Analyzer' },
  { id: 'billing', label: 'Billing' },
  { id: 'reporting', label: 'Reporting' },
  { id: 'system', label: 'System' },
];
