/**
 * Order-domain table cell render helpers with filter navigation support.
 */

import type { MouseEvent, ReactNode } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { EntityId } from '@/components/display/EntityId';
import { formatCurrency } from '@/utils';
import {
  renderDateTimeCell,
  renderPatientNameBlock,
  TABLE_PRIMARY_CELL_CLASS,
} from '@/utils/tableColumnRenders';
import { ROUTES } from '@/config';
import type { OrderTest } from '@/types';
import { TABLE_TYPE } from '@/theme/recipes';
import {
  buildOrderTestsBlockPreview,
  type OrderTestsBlockLayout,
} from './orderTestsBlockPreview';

export function renderOrderId(orderId: string | number, clickable = false): ReactNode {
  return <EntityId type="order" value={orderId} variant={clickable ? 'clickable' : 'block'} />;
}

function renderPatientNameWithId(
  fullName: string,
  patientId: string | number,
  enableNavigation = false
): ReactNode {
  return renderPatientNameBlock(
    fullName,
    <EntityId
      type="patient"
      value={patientId}
      variant="secondary"
      className="truncate"
      navigateToFiltered={
        enableNavigation
          ? { targetPage: ROUTES.ORDERS, filterKey: 'patientId' }
          : undefined
      }
    />
  );
}

export function renderOrderPatientName(patientName: string, patientId: string | number): ReactNode {
  return renderPatientNameWithId(patientName, patientId, false);
}

/**
 * Renders patient name with clickable ID that navigates to orders filtered by patient.
 */
export function renderOrderPatientNameNavigable(
  patientName: string,
  patientId: string | number
): ReactNode {
  return renderPatientNameWithId(patientName, patientId, true);
}

/**
 * Renders sample ID with navigation to lab collection filtered by sample.
 */
export function renderNavigableSampleId(sampleId: string | number): ReactNode {
  return (
    <EntityId
      type="sample"
      value={sampleId}
      variant="clickable"
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

    return (
      <div className="min-w-0 w-full font-normal text-left">
        <div
          className={`${TABLE_TYPE.cell} wrap-break-word font-normal text-left${showAllNames ? '' : ' line-clamp-2'}`}
          title={!showAllNames && preview.labels.length > 0 ? preview.labels.join(', ') : undefined}
        >
          {preview.namesFirstPreview}
        </div>
      </div>
    );
  }

  const { activeCount, countFirstSecondary } = preview;

  return (
    <div className="min-w-0 font-normal">
      <div className={TABLE_PRIMARY_CELL_CLASS}>
        {activeCount} test{activeCount !== 1 ? 's' : ''}
      </div>
      {countFirstSecondary ? (
        <div className={`${TABLE_TYPE.meta} truncate font-normal`}>{countFirstSecondary}</div>
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
    <EntityId
      type="order"
      value={orderId}
      variant="clickable"
      as="button"
      onClick={(e: MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        navigate(`/orders/${orderId}`);
      }}
    />
  );
}
