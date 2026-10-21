/**
 * Field builders for the order test detail modal (overview + workflow panels).
 */

import { Link } from 'react-router-dom';
import type { DescriptionListItemConfig } from '@/components/display/DescriptionList';
import type { OrderTest, Test } from '@/types';
import { RecordId } from '@/features/shared/components';
import { INLINE_LINK } from '@/theme/recipes';
import { formatCurrency } from '@/utils';
import { formatStatusBadgeLabel } from '@/utils/statusBadge';
import {
  buildOrderTestWorkflowFields,
  type OrderTestWorkflowFieldOptions,
} from './buildOrderTestWorkflowFields';

export type OrderTestWorkflowOptions = OrderTestWorkflowFieldOptions;

export { buildOrderTestWorkflowFields };

export interface OrderTestOverviewOptions {
  onCatalogNavigate?: () => void;
}

export function buildOrderTestOverviewFields(
  orderTest: OrderTest,
  catalogTest: Test | undefined,
  options?: OrderTestOverviewOptions
): DescriptionListItemConfig[] {
  const fields: DescriptionListItemConfig[] = [
    {
      label: 'Test ID',
      value:
        orderTest.id != null ? (
          <RecordId type="orderTest" value={orderTest.id} emphasis="block" className="text-right" />
        ) : undefined,
    },
    {
      label: 'Test code',
      value: orderTest.testCode ? (
        <RecordId emphasis="block" className="text-right">{orderTest.testCode}</RecordId>
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
