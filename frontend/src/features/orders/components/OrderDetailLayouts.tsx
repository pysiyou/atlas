/**
 * Order Detail Layout Components
 * Responsive layouts for order detail page
 */

import React from 'react';
import { PagePanel, PagePanelBody, IconButton } from '@/components';
import { cn } from '@/utils';
import { PaymentPopover } from '@/features/payments';
import type { Order, OrderTest, Patient, Invoice } from '@/types';
import { OrderInfoSection } from './OrderInfoSection';
import { PatientInfoSection } from './PatientInfoSection';
import { TestsTable } from './TestsTable';
import { BillingSummarySection } from './BillingSummarySection';
import { OrderCircularProgress } from './OrderCircularProgress';
import { OrderTimeline } from './OrderTimeline';

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

function getTestsTitle(_activeTests: OrderTest[], totalTests: number, supersededCount: number, removedCount: number): string {
  const visibleTests = totalTests - removedCount;

  if (supersededCount > 0) {
    return `Tests (${visibleTests} total, ${supersededCount} superseded)`;
  }

  return `Tests (${visibleTests})`;
}

interface OrderDetailPanelsProps extends LayoutProps {
  infoLayout: 'grid' | 'column';
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
  infoLayout,
  testsVariant,
  fillHeight,
}) => {
  const panelClass = fillHeight ? 'h-full min-h-0' : '';
  const scrollBodyClass = fillHeight ? 'overflow-y-auto' : 'overflow-visible';
  const paddedBody = cn('p-4', scrollBodyClass);
  const testsTitle = getTestsTitle(activeTests, order.tests.length, supersededCount, removedCount);

  return (
    <>
      <div className={`grid grid-cols-3 gap-4 ${fillHeight ? 'min-h-0' : ''}`}>
        <PagePanel title="Order Information" className={panelClass}>
          <PagePanelBody className={paddedBody}>
            <OrderInfoSection order={order} layout={infoLayout} />
          </PagePanelBody>
        </PagePanel>

        <PagePanel
          title="Patient Information"
          className={panelClass}
          headerActions={
            patient ? (
              <IconButton onClick={onViewPatient} variant="view" size="sm" title="View Patient" />
            ) : undefined
          }
        >
          <PagePanelBody className={paddedBody}>
            <PatientInfoSection patient={patient} onViewPatient={onViewPatient} layout={infoLayout} />
          </PagePanelBody>
        </PagePanel>

        <PagePanel
          title="Order Progress"
          className={panelClass}
          headerActions={<OrderCircularProgress order={order} />}
        >
          <PagePanelBody className={cn('p-0', scrollBodyClass)}>
            <OrderTimeline order={order} />
          </PagePanelBody>
        </PagePanel>
      </div>

      <div className={`grid grid-cols-3 gap-4 ${fillHeight ? 'min-h-0' : ''}`}>
        <PagePanel title={testsTitle} className={cn(panelClass, 'col-span-2')}>
          <PagePanelBody
            className={cn(
              'p-0 overflow-visible',
              fillHeight && 'flex flex-col min-h-0',
            )}
          >
            <TestsTable
              tests={order.tests}
              orderId={order.orderId}
              variant={testsVariant}
            />
          </PagePanelBody>
        </PagePanel>

        <PagePanel
          title="Billing Summary"
          className={panelClass}
          headerActions={<PaymentPopover order={order} onSuccess={onPaymentSuccess} size="sm" />}
        >
          <PagePanelBody className={cn(paddedBody, 'flex flex-col')}>
            <BillingSummarySection order={order} invoice={invoice} onViewInvoice={onViewInvoice} />
          </PagePanelBody>
        </PagePanel>
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
  const testsTitle = getTestsTitle(activeTests, order.tests.length, supersededCount, removedCount);

  return (
    <div className="flex-1 flex flex-col gap-5 overflow-y-auto pb-6 bg-surface-page">
      <PagePanel title="Order Information" className="shrink-0">
        <PagePanelBody className="overflow-visible p-4">
          <OrderInfoSection order={order} layout="grid" />
        </PagePanelBody>
      </PagePanel>

      <PagePanel
        title="Patient Information"
        className="shrink-0"
        headerActions={
          patient ? (
            <IconButton onClick={onViewPatient} variant="view" size="sm" title="View Patient" />
          ) : undefined
        }
      >
        <PagePanelBody className="overflow-visible p-4">
          <PatientInfoSection patient={patient} onViewPatient={onViewPatient} layout="grid" />
        </PagePanelBody>
      </PagePanel>

      <PagePanel
        title="Order Progress"
        className="shrink-0"
        headerActions={<OrderCircularProgress order={order} />}
      >
        <PagePanelBody className="overflow-visible p-0">
          <OrderTimeline order={order} />
        </PagePanelBody>
      </PagePanel>

      <PagePanel title={testsTitle} className="shrink-0">
        <PagePanelBody className="p-0 overflow-visible">
          <TestsTable
            tests={order.tests}
            orderId={order.orderId}
            variant="simple"
          />
        </PagePanelBody>
      </PagePanel>

      <PagePanel
        title="Billing Summary"
        className="shrink-0"
        headerActions={<PaymentPopover order={order} onSuccess={onPaymentSuccess} size="sm" />}
      >
        <PagePanelBody className="overflow-visible p-4">
          <BillingSummarySection order={order} invoice={invoice} onViewInvoice={onViewInvoice} />
        </PagePanelBody>
      </PagePanel>
    </div>
  );
};

/**
 * MediumScreenLayout - 3 panels on top, 2 on bottom. Page scrolls when content overflows.
 */
export const MediumScreenLayout: React.FC<LayoutProps> = props => (
  <div className="grid grid-rows-[auto_auto] gap-4 w-full pb-6">
    <OrderDetailPanels {...props} infoLayout="column" testsVariant="detailed" fillHeight={false} />
  </div>
);

/**
 * LargeScreenLayout - 3 panels on top, 2 on bottom. Fills viewport height with internal scrolling.
 */
export const LargeScreenLayout: React.FC<LayoutProps> = props => (
  <div
    className="flex-1 grid grid-rows-[1fr_1fr] gap-4 min-h-0 h-full overflow-hidden"
    style={{ height: '100%', maxHeight: '100%' }}
  >
    <OrderDetailPanels {...props} infoLayout="column" testsVariant="detailed" fillHeight />
  </div>
);
