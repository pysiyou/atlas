/**
 * Event log kind options (the six eventType roots).
 */
import type { EventLogKind } from './types';

export interface EventLogKindOption {
  id: EventLogKind;
  label: string;
}

export const EVENT_LOG_KIND_OPTIONS: EventLogKindOption[] = [
  { id: 'patient', label: 'Patient' },
  { id: 'order', label: 'Order' },
  { id: 'laboratory', label: 'Laboratory' },
  { id: 'billing', label: 'Billing' },
  { id: 'reporting', label: 'Reporting' },
  { id: 'system', label: 'System' },
];
