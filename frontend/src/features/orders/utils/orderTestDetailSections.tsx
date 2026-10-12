/**
 * Field builders for the order test detail modal (overview + workflow panels).
 */

import { Link } from 'react-router-dom';
import type { DetailFieldConfig } from '@/components/display/DetailFieldGroup';
import type { OrderTest, Test } from '@/types';
import { Button, EntityId } from '@/components';
import { INLINE_LINK } from '@/components/theme/recipes';
import { displayId, formatCurrency } from '@/utils';
import { formatStatusBadgeLabel } from '@/utils/statusBadge';
import type { LinkedOrderTests } from './orderTestLineage';

export interface OrderTestWorkflowOptions {
  linked?: LinkedOrderTests;
  onOpenLinkedTest?: (test: OrderTest) => void;
  /** When results are shown in ResultValidationForm, omit duplicate note/flag fields. */
  omitResultDuplicates?: boolean;
}

export interface OrderTestOverviewOptions {
  onCatalogNavigate?: () => void;
}

export function buildOrderTestWorkflowFields(
  orderTest: OrderTest,
  options?: OrderTestWorkflowOptions
): DetailFieldConfig[] {
  const fields: DetailFieldConfig[] = [];
  const linked = options?.linked;
  const onOpenLinkedTest = options?.onOpenLinkedTest;
  const omitResultDuplicates = options?.omitResultDuplicates ?? false;
  const lab = orderTest.lab;

  if (orderTest.status === 'superseded') {
    fields.push({
      label: 'Status note',
      value: 'This entry was superseded by a later test on the order.',
    });
  }

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

  if (orderTest.isReflexTest) {
    fields.push({ label: 'Reflex test', value: 'Yes' });
    if (orderTest.triggeredBy) {
      fields.push({ label: 'Triggered by', value: orderTest.triggeredBy });
    }
    if (orderTest.reflexRule) {
      fields.push({ label: 'Reflex rule', value: orderTest.reflexRule });
    }
  }

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

  return fields;
}

export function buildOrderTestOverviewFields(
  orderTest: OrderTest,
  catalogTest: Test | undefined,
  options?: OrderTestOverviewOptions
): DetailFieldConfig[] {
  const fields: DetailFieldConfig[] = [
    {
      label: 'Test ID',
      value:
        orderTest.id != null ? (
          <EntityId type="orderTest" value={orderTest.id} variant="block" className="text-right" />
        ) : undefined,
    },
    {
      label: 'Test code',
      value: orderTest.testCode ? (
        <EntityId variant="block" className="text-right">{orderTest.testCode}</EntityId>
      ) : undefined,
    },
    {
      label: 'Sample type',
      value: orderTest.sampleType
        ? formatStatusBadgeLabel(orderTest.sampleType)
        : undefined,
    },
    {
      label: 'Status',
      value: formatStatusBadgeLabel(orderTest.status),
    },
    { label: 'Price at order', value: formatCurrency(orderTest.priceAtOrder) },
    { label: 'Created', timestamp: orderTest.createdAt },
    { label: 'Updated', timestamp: orderTest.updatedAt },
  ];

  const catalogCode = catalogTest?.code ?? orderTest.testCode;
  if (catalogCode) {
    const catalogLabel = catalogTest?.name ?? catalogCode;
    fields.push({
      label: 'Catalog entry',
      value: (
        <Link
          to={`/catalog/${catalogCode}`}
          className={`${INLINE_LINK} text-right`}
          onClick={() => options?.onCatalogNavigate?.()}
        >
          {catalogLabel}
        </Link>
      ),
    });
  }

  return fields;
}

export function formatPipelinePendingMessage(orderTest: OrderTest): string {
  const stage = orderTest.lab?.pipelineStage;
  if (!stage) {
    return 'No results recorded yet.';
  }
  if (stage === 'completed') {
    return 'This test is marked complete; results may still be pending delivery.';
  }
  if (stage === 'cancelled') {
    return 'This test was cancelled.';
  }
  return `Results are not available yet. Current lab stage: ${formatStatusBadgeLabel(stage)}.`;
}
