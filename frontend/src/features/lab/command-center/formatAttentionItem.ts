/**
 * Attention item formatting — dedicated copy per attention type (not workflow stage).
 */

import { displayId } from '@/utils';
import { LAB_CONFIG } from '@/features/lab/constants';
import type { AttentionItem } from './boardTypes';
import type { AttentionType } from './attentionCategories';

export type AttentionDetail =
  | { type: 'text'; value: string }
  | { type: 'link'; value: string; to: string }
  | { type: 'testId'; value: string }
  | { type: 'priority'; value: string }
  | { type: 'wait'; value: string };

export interface FormattedAttentionItem {
  action: string;
  details: AttentionDetail[];
}

type AttentionHandler = (item: AttentionItem) => FormattedAttentionItem;

function orderLink(orderId: number): AttentionDetail {
  return { type: 'link', value: displayId.order(orderId), to: `/orders/${orderId}` };
}

function patientChip(item: AttentionItem): AttentionDetail {
  return { type: 'text', value: item.patientName };
}

function testIdChip(item: AttentionItem): AttentionDetail | null {
  const ids = item.orderTestIds;
  if (!ids.length) return null;
  if (ids.length === 1) {
    return { type: 'testId', value: displayId.orderTest(ids[0]) };
  }
  const preview = ids.slice(0, 2).map(id => displayId.orderTest(id)).join(', ');
  const suffix = ids.length > 2 ? ` +${ids.length - 2}` : '';
  return { type: 'testId', value: `${preview}${suffix}` };
}

function queueChip(item: AttentionItem): AttentionDetail {
  const unit = item.stage === 'collection' ? 'specimens' : 'analytes';
  const countLabel = item.workItemCount > 1 ? ` · ${item.workItemCount} ${unit}` : '';
  return { type: 'text', value: `${item.stageLabel}${countLabel}` };
}

function waitChip(item: AttentionItem): AttentionDetail {
  const label = item.waitingHours < 1 ? 'TAT <1h' : `TAT ${item.waitingHours}h`;
  return { type: 'wait', value: label };
}

function priorityChip(item: AttentionItem, type: AttentionType): AttentionDetail | null {
  if (type === 'priority_urgent' || type === 'priority_high') return null;
  if (item.priority !== 'urgent' && item.priority !== 'high') return null;
  return { type: 'priority', value: item.priority };
}

function baseDetails(
  item: AttentionItem,
  type: AttentionType,
  extras: AttentionDetail[] = [],
): AttentionDetail[] {
  const details: AttentionDetail[] = [patientChip(item), orderLink(item.orderId)];
  const testId = testIdChip(item);
  if (testId) details.push(testId);
  const priority = priorityChip(item, type);
  if (priority) details.push(priority);
  details.push(...extras, queueChip(item), waitChip(item));
  return details;
}

const ATTENTION_HANDLERS: Record<AttentionType, AttentionHandler> = {
  escalation_critical: item => ({
    action: 'Panic value — path review required',
    details: baseDetails(item, 'escalation_critical', [{ type: 'text', value: 'Escalation' }]),
  }),

  escalation_amendment: item => ({
    action: 'Amended result — pending path release',
    details: baseDetails(item, 'escalation_amendment', [{ type: 'text', value: 'Escalation' }]),
  }),

  escalation_retry_limit: item => ({
    action: 'Repeat limit hit — path approval needed',
    details: baseDetails(item, 'escalation_retry_limit', [{ type: 'text', value: 'Escalation' }]),
  }),

  escalation_recollection_limit: item => ({
    action: 'Redraw limit hit — path approval needed',
    details: baseDetails(item, 'escalation_recollection_limit', [{ type: 'text', value: 'Escalation' }]),
  }),

  supervisor_approval: item => ({
    action: 'Pending supervisor release',
    details: baseDetails(item, 'supervisor_approval', [{ type: 'text', value: 'Escalation' }]),
  }),

  supervisor_recollection_request: item => ({
    action: 'Redraw request — pending approval',
    details: baseDetails(item, 'supervisor_recollection_request', [{ type: 'text', value: 'Escalation' }]),
  }),

  payment_blocked: item => ({
    action: 'Phlebotomy hold — unpaid accession',
    details: baseDetails(item, 'payment_blocked'),
  }),

  sample_rejected: item => ({
    action: 'Specimen rejected — pre-analytical hold',
    details: baseDetails(item, 'sample_rejected'),
  }),

  recollection_waiting: item => ({
    action: 'Redraw required before analysis',
    details: baseDetails(item, 'recollection_waiting'),
  }),

  retest_in_progress: item => ({
    action: 'Repeat analysis in progress',
    details: baseDetails(item, 'retest_in_progress'),
  }),

  priority_urgent: item => ({
    action: 'STAT accession — expedite',
    details: baseDetails(item, 'priority_urgent'),
  }),

  priority_high: item => ({
    action: 'Elevated priority — shorten TAT',
    details: baseDetails(item, 'priority_high'),
  }),

  queue_overdue_critical: item => ({
    action: `TAT exceeded — >${LAB_CONFIG.QUEUE_AGE_CRITICAL_HOURS}h in queue`,
    details: baseDetails(item, 'queue_overdue_critical'),
  }),

  queue_overdue_warning: item => ({
    action: `TAT at risk — >${LAB_CONFIG.QUEUE_AGE_WARNING_HOURS}h in queue`,
    details: baseDetails(item, 'queue_overdue_warning'),
  }),
};

export function formatAttentionItem(item: AttentionItem, type: AttentionType): FormattedAttentionItem {
  return ATTENTION_HANDLERS[type](item);
}
