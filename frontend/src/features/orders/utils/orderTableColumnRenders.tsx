/**
 * Order-domain table cell render helpers.
 */

import type { MouseEvent, ReactNode } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { RecordId } from '@/features/shared';
import { formatCurrency } from '@/utils';
import {
  renderDateTimeCell,
  renderPatientNameBlock,
  TABLE_PRIMARY_CELL_CLASS,
} from '@/utils/tableColumnRenders';
import { PRESENTATION_STACK_CLASS } from '@/theme/recipes';
import type { Gender, OrderTest } from '@/types';
import { renderPatientSexAgeSecondary } from '@/features/patients/utils/patientTableColumnRenders';
import { renderTruncatedListPreview } from '@/utils/truncatedListPreviewRender';
import { TABLE_TYPE } from '@/theme/recipes';
import {
  buildOrderTestsBlockPreview,
  type OrderTestsBlockLayout,
} from './orderTestsBlockPreview';

export function renderOrderId(orderId: string | number, clickable = false): ReactNode {
  return <RecordId type="order" value={orderId} emphasis={clickable ? 'interactive' : 'block'} />;
}

export interface OrderPatientDemographics {
  gender?: Gender | string | null;
  dateOfBirth?: string | null;
}

export function renderOrderPatientName(
  patientName: string,
  demographics?: OrderPatientDemographics,
): ReactNode {
  return renderPatientNameBlock(
    patientName,
    renderPatientSexAgeSecondary(demographics?.gender, demographics?.dateOfBirth),
  );
}

/**
 * Renders sample ID with navigation to lab collection filtered by sample.
 */
export function renderNavigableSampleId(sampleId: string | number): ReactNode {
  return (
    <RecordId
      type="sample"
      value={sampleId}
      emphasis="interactive"
      navigateToFiltered={{
        targetPage: '/laboratory/collection',
        filterKey: 'sampleId',
        labTab: 'collection',
      }}
    />
  );
}

export type { OrderTestsBlockLayout };

export interface RenderOrderTestsBlockOptions {
  fallbackCount?: number;
  testCodes?: string[];
  getTestName?: (testCode: string) => string;
  /** namesFirst: test names on top (patient related orders). Default countFirst. */
  layout?: OrderTestsBlockLayout;
  /** When true with namesFirst, list every test name (no "+N more"). */
  showAllNames?: boolean;
}

export function renderOrderTestsBlock(
  activeTests: Pick<OrderTest, 'testCode' | 'testName'>[],
  options?: RenderOrderTestsBlockOptions | number
): ReactNode {
  const resolved: RenderOrderTestsBlockOptions =
    typeof options === 'number' ? { fallbackCount: options } : (options ?? {});

  const preview = buildOrderTestsBlockPreview({
    activeTests,
    ...resolved,
  });

  if (resolved.layout === 'namesFirst') {
    if (!preview.namesFirstPreview) {
      return null;
    }

    const showAllNames = resolved.showAllNames ?? false;

    const namesContent =
      showAllNames || preview.labels.length === 0
        ? preview.namesFirstPreview
        : renderTruncatedListPreview(preview.labels);

    return (
      <div className="min-w-0 w-full font-normal text-left">
        <div
          className={`${TABLE_TYPE.cell} wrap-break-word font-normal text-left${showAllNames ? '' : ' line-clamp-2'}`}
          title={!showAllNames && preview.labels.length > 0 ? preview.labels.join(', ') : undefined}
        >
          {namesContent}
        </div>
      </div>
    );
  }

  const { activeCount, labels } = preview;
  const secondaryContent =
    resolved.showAllNames || labels.length === 0
      ? preview.countFirstSecondary
      : renderTruncatedListPreview(labels);

  return (
    <div className={PRESENTATION_STACK_CLASS}>
      <div className={TABLE_PRIMARY_CELL_CLASS}>
        {activeCount} test{activeCount !== 1 ? 's' : ''}
      </div>
      {secondaryContent ? (
        <div className={`${TABLE_TYPE.meta} truncate font-normal`}>{secondaryContent}</div>
      ) : null}
    </div>
  );
}

export function renderOrderTotalPrice(totalPrice: number): ReactNode {
  return (
    <div className={`${TABLE_TYPE.amount} truncate font-normal`}>{formatCurrency(totalPrice)}</div>
  );
}

export function renderOrderTotalPriceInline(totalPrice: number): ReactNode {
  return (
    <span className={`${TABLE_TYPE.amount} truncate block font-normal`}>
      {formatCurrency(totalPrice)}
    </span>
  );
}

export function renderOrderDateCell(date: string | Date | null | undefined): ReactNode {
  return renderDateTimeCell(date);
}

export function renderNavigableOrderId(
  orderId: string | number,
  navigate: NavigateFunction
): ReactNode {
  return (
    <RecordId
      type="order"
      value={orderId}
      emphasis="interactive"
      as="button"
      onClick={(e: MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        navigate(`/orders/${orderId}`);
      }}
    />
  );
}
