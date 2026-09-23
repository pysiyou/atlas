/**
 * Order Detail Layout Components
 * Responsive layouts for order detail page
 */

import React from 'react';
import { actionButtonPreset, Panel, IconButton, Icon } from '@/components';
import { ICONS } from '@/config/icons';
import { LAYOUT, SPACING } from '@/components/theme/recipes';
import { cn } from '@/utils';
import { PaymentPopover } from '@/features/payments';
import type { Order, OrderTest, Patient, Invoice } from '@/types';
import { OrderInfoSection } from './OrderInfoSection';
import { PatientInfoSection } from './PatientInfoSection';
import { TestsTable } from './TestsTable';
import { BillingSummarySection } from './BillingSummarySection';
import { OrderCircularProgress } from './OrderCircularProgress';
import { OrderEventTimeline } from './OrderEventTimeline';

interface LayoutProps {
  order: Order;
  patient: Patient | null;
  invoice: Invoice | null;
  activeTests: OrderTest[];
  supersededCount: number;
  removedCount: number;
  onViewPatient: () => void;
  onViewInvoice: () => void;
  /** Callback invoked on successful payment */
  onPaymentSuccess?: () => void;
}

function BillingSummaryPanelActions({
  order,
  invoice,
  onViewInvoice,
  onPaymentSuccess,
}: {
  order: Order;
  invoice: Invoice | null;
  onViewInvoice: () => void;
  onPaymentSuccess?: () => void;
}) {
  const isPaid = order.paymentStatus === 'paid';

  return (
    <div className={`flex items-center ${SPACING.gapInline}`}>
      {invoice != null && (
        <IconButton
          {...actionButtonPreset('print')}
          size="sm"
          title="View Invoice"
          icon={<Icon name={ICONS.dataFields.bill} className="w-4 h-4" />}
          onClick={onViewInvoice}
        />
      )}
      {!isPaid && <PaymentPopover order={order} onSuccess={onPaymentSuccess} size="sm" />}
    </div>
  );
}

function getTestsHeaderMeta(totalTests: number, supersededCount: number, removedCount: number): string {
  const visibleTests = totalTests - removedCount;

  if (supersededCount > 0) {
    return `${visibleTests} total, ${supersededCount} superseded`;
  }

  return String(visibleTests);
}

interface OrderDetailPanelsProps extends LayoutProps {
  testsVariant: 'simple' | 'detailed';
  fillHeight: boolean;
}

/**
 * Shared panel set: top row (Order, Patient, Progress) + bottom row (Tests, Billing).
 */
const OrderDetailPanels: React.FC<OrderDetailPanelsProps> = ({
  order,
  patient,
  invoice,
  activeTests,
  supersededCount,
  removedCount,
  onViewPatient,
  onViewInvoice,
  onPaymentSuccess,
  testsVariant,
  fillHeight,
}) => {
  const panelClass = fillHeight ? 'h-full min-h-0' : '';
  const fillScroll = fillHeight ? 'auto' : 'visible';
  const testsHeaderMeta = getTestsHeaderMeta(
    order.tests?.length ?? activeTests.length,
    supersededCount,
    removedCount
  );

  return (
    <>
      <div className={cn(LAYOUT.detailGrid3, fillHeight && 'min-h-0')}>
        <Panel title="Order Information" className={panelClass} scroll={fillScroll}>
          <OrderInfoSection order={order} />
        </Panel>

        <Panel
          title="Patient Information"
          className={panelClass}
          scroll={fillScroll}
          headerEnd={
            patient ? (
              <IconButton onClick={onViewPatient} {...actionButtonPreset('view')} size="sm" title="View Patient" />
            ) : undefined
          }
        >
          <PatientInfoSection patient={patient} onViewPatient={onViewPatient} />
        </Panel>

        <Panel
          title="Order Progress"
          className={panelClass}
          padding="none"
          scroll={fillScroll}
          headerEnd={<OrderCircularProgress order={order} />}
        >
          <OrderEventTimeline orderId={order.orderId} />
        </Panel>
      </div>

      <div className={cn(LAYOUT.detailGrid3, fillHeight && 'min-h-0')}>
        <Panel
          title="Tests"
          meta={testsHeaderMeta}
          className={cn(panelClass, 'col-span-2')}
          padding="none"
          scroll={fillHeight ? 'auto' : 'visible'}
          bodyClassName={fillHeight ? 'flex flex-col' : undefined}
        >
          <TestsTable
            tests={order.tests ?? []}
            orderId={order.orderId}
            variant={testsVariant}
          />
        </Panel>

        <Panel
          title="Billing Summary"
          className={panelClass}
          padding="none"
          scroll={fillScroll}
          bodyClassName="flex flex-col"
          headerEnd={
            <BillingSummaryPanelActions
              order={order}
              invoice={invoice}
              onViewInvoice={onViewInvoice}
              onPaymentSuccess={onPaymentSuccess}
            />
          }
        >
          <BillingSummarySection order={order} />
        </Panel>
      </div>
    </>
  );
};

/**
 * SmallScreenLayout - Single column stack for small screens.
 */
export const SmallScreenLayout: React.FC<LayoutProps> = props => {
  const { order, patient, invoice, activeTests, supersededCount, removedCount, onViewPatient, onViewInvoice, onPaymentSuccess } =
    props;
  const testsHeaderMeta = getTestsHeaderMeta(
    order.tests?.length ?? activeTests.length,
    supersededCount,
    removedCount
  );

  return (
    <div className={LAYOUT.detailScroll}>
      <Panel title="Order Information" className="shrink-0" scroll="visible">
        <OrderInfoSection order={order} />
      </Panel>

      <Panel
        title="Patient Information"
        className="shrink-0"
        scroll="visible"
        headerEnd={
          patient ? (
            <IconButton onClick={onViewPatient} {...actionButtonPreset('view')} size="sm" title="View Patient" />
          ) : undefined
        }
      >
        <PatientInfoSection patient={patient} onViewPatient={onViewPatient} />
      </Panel>

      <Panel
        title="Order Progress"
        className="shrink-0"
        padding="none"
        scroll="visible"
        headerEnd={<OrderCircularProgress order={order} />}
      >
        <OrderEventTimeline orderId={order.orderId} />
      </Panel>

      <Panel title="Tests" meta={testsHeaderMeta} className="shrink-0" padding="none" scroll="visible">
        <TestsTable
          tests={order.tests ?? []}
          orderId={order.orderId}
          variant="simple"
        />
      </Panel>

      <Panel
        title="Billing Summary"
        className="shrink-0"
        padding="none"
        scroll="visible"
        headerEnd={
          <BillingSummaryPanelActions
            order={order}
            invoice={invoice}
            onViewInvoice={onViewInvoice}
            onPaymentSuccess={onPaymentSuccess}
          />
        }
      >
        <BillingSummarySection order={order} />
      </Panel>
    </div>
  );
};

/**
 * MediumScreenLayout - 3 panels on top, 2 on bottom. Page scrolls when content overflows.
 */
export const MediumScreenLayout: React.FC<LayoutProps> = props => (
  <div className={LAYOUT.detailGridRows2}>
    <OrderDetailPanels {...props} testsVariant="detailed" fillHeight={false} />
  </div>
);

/**
 * LargeScreenLayout - 3 panels on top, 2 on bottom. Fills viewport height with internal scrolling.
 */
export const LargeScreenLayout: React.FC<LayoutProps> = props => (
  <div className={LAYOUT.detailGridRowsSplit} style={{ height: '100%', maxHeight: '100%' }}>
    <OrderDetailPanels {...props} testsVariant="detailed" fillHeight />
  </div>
);
