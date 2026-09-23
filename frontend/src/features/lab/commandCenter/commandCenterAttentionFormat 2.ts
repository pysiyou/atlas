/**
 * Attention item formatting — dedicated copy per attention type (not workflow stage).
 */

import { displayId } from '@/utils';
import { LAB_CONFIG } from '../constants/labConstants';
import { LAB_COPY } from '../constants/labConstants';
import type { LabAttentionQueueItem } from './commandCenterModel';
import type { AttentionType } from './commandCenterModel';

export type AttentionDetail =
  | { type: 'text'; value: string }
  | { type: 'link'; value: string; to: string }
  | { type: 'testId'; value: string }
  | { type: 'priority'; value: string }
  | { type: 'wait'; value: string };

export interface FormattedLabAttentionQueueItem {
  action: string;
  details: AttentionDetail[];
}

type AttentionHandler = (item: LabAttentionQueueItem) => FormattedLabAttentionQueueItem;

function orderLink(orderId: number): AttentionDetail {
  return { type: 'link', value: displayId.order(orderId), to: `/orders/${orderId}` };
}

function patientChip(item: LabAttentionQueueItem): AttentionDetail {
  return { type: 'text', value: item.patientName };
}

function testIdChip(item: LabAttentionQueueItem): AttentionDetail | null {
  const ids = item.orderTestIds;
  if (!ids.length) return null;
  if (ids.length === 1) {
    return { type: 'testId', value: displayId.orderTest(ids[0]) };
  }
  const preview = ids.slice(0, 2).map(id => displayId.orderTest(id)).join(', ');
  const suffix = ids.length > 2 ? ` +${ids.length - 2}` : '';
  return { type: 'testId', value: `${preview}${suffix}` };
}

function queueChip(item: LabAttentionQueueItem): AttentionDetail {
  const unit = item.stage === 'collection' ? LAB_COPY.entity.samples : 'tests';
  const countLabel = item.workItemCount > 1 ? ` · ${item.workItemCount} ${unit}` : '';
  return { type: 'text', value: `${item.stageLabel}${countLabel}` };
}

function waitChip(item: LabAttentionQueueItem): AttentionDetail {
  const label =
    item.waitingHours < 1
      ? 'Turnaround under 1 hour'
      : `Turnaround ${item.waitingHours} hours`;
  return { type: 'wait', value: label };
}

function priorityChip(item: LabAttentionQueueItem, type: AttentionType): AttentionDetail | null {
  if (type === 'priority_urgent' || type === 'priority_high') return null;
  if (item.priority !== 'urgent' && item.priority !== 'high') return null;
  return { type: 'priority', value: item.priority };
}

function blockedReasonChip(item: LabAttentionQueueItem): AttentionDetail | null {
  if (!item.blockedLabel) return null;
  return { type: 'text', value: item.blockedLabel };
}

function baseDetails(
  item: LabAttentionQueueItem,
  type: AttentionType,
  extras: AttentionDetail[] = [],
): AttentionDetail[] {
  const details: AttentionDetail[] = [patientChip(item), orderLink(item.orderId)];
  const testId = testIdChip(item);
  if (testId) details.push(testId);
  const priority = priorityChip(item, type);
  if (priority) details.push(priority);
  const blocked = blockedReasonChip(item);
  if (blocked) details.push(blocked);
  details.push(...extras, queueChip(item), waitChip(item));
  return details;
}

const ESCALATION_DETAIL: AttentionDetail = { type: 'text', value: 'Clinical escalation' };

const ATTENTION_HANDLERS: Record<AttentionType, AttentionHandler> = {
  escalation_critical: item => ({
    action: `${LAB_COPY.attention.criticalValue} — pathologist review required`,
    details: baseDetails(item, 'escalation_critical', [ESCALATION_DETAIL]),
  }),

  escalation_amendment: item => ({
    action: 'Amended result — pending pathologist release',
    details: baseDetails(item, 'escalation_amendment', [ESCALATION_DETAIL]),
  }),

  escalation_retry_limit: item => ({
    action: 'Repeat analysis limit — pathologist authorization required',
    details: baseDetails(item, 'escalation_retry_limit', [ESCALATION_DETAIL]),
  }),

  escalation_recollection_limit: item => ({
    action: `${LAB_COPY.attention.recollection} limit — pathologist authorization required`,
    details: baseDetails(item, 'escalation_recollection_limit', [ESCALATION_DETAIL]),
  }),

  supervisor_approval: item => ({
    action: 'Awaiting pathologist release',
    details: baseDetails(item, 'supervisor_approval', [ESCALATION_DETAIL]),
  }),

  supervisor_recollection_request: item => ({
    action: `${LAB_COPY.attention.recollection} request — pending authorization`,
    details: baseDetails(item, 'supervisor_recollection_request', [ESCALATION_DETAIL]),
  }),

  payment_blocked: item => ({
    action: 'Accession on hold — payment required before collection',
    details: baseDetails(item, 'payment_blocked'),
  }),

  sample_rejected: item => ({
    action: 'Pre-analytical rejection — sample cannot proceed',
    details: baseDetails(item, 'sample_rejected'),
  }),

  recollection_waiting: item => ({
    action: `${LAB_COPY.attention.recollection} required before analysis`,
    details: baseDetails(item, 'recollection_waiting'),
  }),

  retest_in_progress: item => ({
    action: 'Repeat analysis in progress',
    details: baseDetails(item, 'retest_in_progress'),
  }),

  priority_urgent: item => ({
    action: 'STAT accession — prioritize handling',
    details: baseDetails(item, 'priority_urgent'),
  }),

  priority_high: item => ({
    action: 'High priority — monitor turnaround closely',
    details: baseDetails(item, 'priority_high'),
  }),

  queue_overdue_critical: item => ({
    action: `Turnaround exceeded — more than ${LAB_CONFIG.QUEUE_AGE_CRITICAL_HOURS} hours in queue`,
    details: baseDetails(item, 'queue_overdue_critical'),
  }),

  queue_overdue_warning: item => ({
    action: `Turnaround at risk — more than ${LAB_CONFIG.QUEUE_AGE_WARNING_HOURS} hours in queue`,
    details: baseDetails(item, 'queue_overdue_warning'),
  }),
};

export function formatLabAttentionQueueItem(item: LabAttentionQueueItem, type: AttentionType): FormattedLabAttentionQueueItem {
  return ATTENTION_HANDLERS[type](item);
}
