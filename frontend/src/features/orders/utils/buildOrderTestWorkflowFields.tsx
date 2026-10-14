/**
 * Workflow panel fields for the order test detail modal.
 */

import type { DetailFieldConfig } from '@/components/display/DetailFieldGroup';
import type { OrderTest } from '@/types';
import { Button } from '@/components/primitives';
import { displayId } from '@/utils';
import { formatStatusBadgeLabel } from '@/utils/statusBadge';
import type { LinkedOrderTests } from './orderTestLineage';

export interface OrderTestWorkflowFieldOptions {
  linked?: LinkedOrderTests;
  onOpenLinkedTest?: (test: OrderTest) => void;
  /** When results are shown in ResultValidationForm, omit duplicate note/flag fields. */
  omitResultDuplicates?: boolean;
}

function appendSupersededNote(fields: DetailFieldConfig[], orderTest: OrderTest): void {
  if (orderTest.status !== 'superseded') {
    return;
  }
  fields.push({
    label: 'Status note',
    value: 'This entry was superseded by a later test on the order.',
  });
}

function appendLineageFields(
  fields: DetailFieldConfig[],
  orderTest: OrderTest,
  linked?: LinkedOrderTests,
  onOpenLinkedTest?: (test: OrderTest) => void
): void {
  if (linked?.prior && onOpenLinkedTest) {
    fields.push({
      label: 'Prior test',
      value: (
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => onOpenLinkedTest(linked.prior!)}
        >
          {displayId.orderTest(linked.prior.id)}
        </Button>
      ),
    });
  } else if (orderTest.retestOfTestId != null) {
    fields.push({
      label: 'Retest of',
      value: displayId.orderTest(orderTest.retestOfTestId),
    });
  }

  if (linked?.replacement && onOpenLinkedTest) {
    fields.push({
      label: 'Replacement test',
      value: (
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => onOpenLinkedTest(linked.replacement!)}
        >
          {displayId.orderTest(linked.replacement.id)}
        </Button>
      ),
    });
  } else if (orderTest.retestOrderTestId != null) {
    fields.push({
      label: 'Replacement',
      value: displayId.orderTest(orderTest.retestOrderTestId),
    });
  }

  if (orderTest.isRetest) {
    fields.push({
      label: 'Retest attempt',
      value: String((orderTest.retestNumber ?? 0) + 1),
    });
  }
}

function appendLabPipelineFields(fields: DetailFieldConfig[], orderTest: OrderTest): void {
  const lab = orderTest.lab;
  if (lab?.pipelineStage) {
    fields.push({
      label: 'Lab stage',
      value: formatStatusBadgeLabel(lab.pipelineStage),
    });
  }
  if (lab?.attentionLabel) {
    fields.push({ label: 'Attention', value: lab.attentionLabel });
  }
  if (lab?.attentionReason) {
    fields.push({
      label: 'Attention reason',
      value: formatStatusBadgeLabel(lab.attentionReason),
    });
  }
  if (lab?.denyMessage) {
    fields.push({ label: 'Blocked', value: lab.denyMessage });
  }
}

function appendResultAuditFields(
  fields: DetailFieldConfig[],
  orderTest: OrderTest,
  omitResultDuplicates: boolean
): void {
  if (orderTest.resultEnteredAt) {
    fields.push({
      label: 'Entered',
      timestamp: orderTest.resultEnteredAt,
      user: orderTest.enteredBy,
    });
  }
  if (orderTest.resultValidatedAt) {
    fields.push({
      label: 'Validated',
      timestamp: orderTest.resultValidatedAt,
      user: orderTest.validatedBy,
    });
  }
  if (!omitResultDuplicates && orderTest.validationNotes) {
    fields.push({ label: 'Validation notes', value: orderTest.validationNotes });
  }
  if (!omitResultDuplicates && orderTest.flags?.length) {
    fields.push({ label: 'Flags', value: orderTest.flags.join(', ') });
  }
  if (!omitResultDuplicates && orderTest.technicianNotes) {
    fields.push({ label: 'Technician notes', value: orderTest.technicianNotes });
  }
}

function appendReflexFields(fields: DetailFieldConfig[], orderTest: OrderTest): void {
  if (!orderTest.isReflexTest) {
    return;
  }
  fields.push({ label: 'Reflex test', value: 'Yes' });
  if (orderTest.triggeredBy) {
    fields.push({ label: 'Triggered by', value: orderTest.triggeredBy });
  }
  if (orderTest.reflexRule) {
    fields.push({ label: 'Reflex rule', value: orderTest.reflexRule });
  }
}

function appendCriticalValueFields(fields: DetailFieldConfig[], orderTest: OrderTest): void {
  if (orderTest.hasCriticalValues) {
    fields.push({ label: 'Critical values', value: 'Present' });
  }
  if (orderTest.criticalNotificationSent) {
    fields.push({ label: 'Critical notification', value: 'Sent' });
  }
  if (orderTest.criticalNotifiedAt) {
    fields.push(
      { label: 'Critical notified', timestamp: orderTest.criticalNotifiedAt },
      { label: 'Notified to', value: orderTest.criticalNotifiedTo }
    );
  }
  if (orderTest.criticalAcknowledgedAt) {
    fields.push({
      label: 'Critical acknowledged',
      timestamp: orderTest.criticalAcknowledgedAt,
    });
  }
}

export function buildOrderTestWorkflowFields(
  orderTest: OrderTest,
  options?: OrderTestWorkflowFieldOptions
): DetailFieldConfig[] {
  const fields: DetailFieldConfig[] = [];
  const linked = options?.linked;
  const onOpenLinkedTest = options?.onOpenLinkedTest;
  const omitResultDuplicates = options?.omitResultDuplicates ?? false;

  appendSupersededNote(fields, orderTest);
  appendLineageFields(fields, orderTest, linked, onOpenLinkedTest);
  appendLabPipelineFields(fields, orderTest);
  appendResultAuditFields(fields, orderTest, omitResultDuplicates);
  appendReflexFields(fields, orderTest);
  appendCriticalValueFields(fields, orderTest);

  return fields;
}
