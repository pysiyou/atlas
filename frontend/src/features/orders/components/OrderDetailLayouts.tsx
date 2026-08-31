/**
 * Order Detail Layout Components
 * Responsive layouts for order detail page
 */

import React from 'react';
import { SectionPanel, IconButton } from '@/components';
import { PaymentPopover } from '@/features/payments/components/PaymentPopover';
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
  onViewPatient: () => void;
  onViewInvoice: () => void;
  /** Callback invoked on successful payment */
  onPaymentSuccess?: () => void;
}

function getTestsTitle(activeTests: OrderTest[], totalTests: number, supersededCount: number): string {
  return supersededCount > 0
    ? `Tests (${activeTests.length} active)`
    : `Tests (${totalTests})`;
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
  onViewPatient,
  onViewInvoice,
  onPaymentSuccess,
  infoLayout,
  testsVariant,
  fillHeight,
}) => {
  const panelClass = fillHeight ? 'h-full flex flex-col min-h-0' : 'bg-surface';
  const scrollContentClass = fillHeight ? 'flex-1 min-h-0 overflow-y-auto' : 'overflow-visible';
  const testsTitle = getTestsTitle(activeTests, order.tests.length, supersededCount);

  return (
    <>
      <div className={`grid grid-cols-3 gap-4 ${fillHeight ? 'min-h-0' : ''}`}>
        <SectionPanel
          title="Order Information"
          className={panelClass}
          contentClassName={scrollContentClass}
        >
          <OrderInfoSection order={order} layout={infoLayout} />
        </SectionPanel>

        <SectionPanel
          title="Patient Information"
          className={panelClass}
          contentClassName={scrollContentClass}
          headerClassName="!py-1.5"
          headerRight={
            patient && (
              <IconButton onClick={onViewPatient} variant="view" size="sm" title="View Patient" />
            )
          }
        >
          <PatientInfoSection patient={patient} onViewPatient={onViewPatient} layout={infoLayout} />
        </SectionPanel>

        <SectionPanel
          title="Order Progress"
          className={panelClass}
          contentClassName={`${scrollContentClass} p-0`}
          headerClassName="!py-1.5"
          headerRight={<OrderCircularProgress order={order} />}
        >
          <OrderTimeline order={order} />
        </SectionPanel>
      </div>

      <div className={`grid grid-cols-3 gap-4 ${fillHeight ? 'min-h-0' : ''}`}>
        <SectionPanel
          title={testsTitle}
          className={`${panelClass} col-span-2`}
          contentClassName={`${fillHeight ? 'flex-1 min-h-0' : ''} p-0 overflow-visible`}
        >
          <TestsTable
            tests={order.tests}
            orderId={order.orderId}
            supersededCount={supersededCount}
            variant={testsVariant}
          />
        </SectionPanel>

        <SectionPanel
          title="Billing Summary"
          className={panelClass}
          contentClassName={`${scrollContentClass} flex flex-col`}
          headerRight={<PaymentPopover order={order} onSuccess={onPaymentSuccess} size="sm" />}
        >
          <BillingSummarySection order={order} invoice={invoice} onViewInvoice={onViewInvoice} />
        </SectionPanel>
      </div>
    </>
  );
};

/**
 * SmallScreenLayout - Single column stack for small screens.
 */
export const SmallScreenLayout: React.FC<LayoutProps> = props => {
  const { order, patient, invoice, activeTests, supersededCount, onViewPatient, onViewInvoice, onPaymentSuccess } =
    props;
  const testsTitle = getTestsTitle(activeTests, order.tests.length, supersededCount);

  return (
    <div className="flex-1 flex flex-col gap-5 overflow-y-auto pb-6 bg-surface-page">
      <SectionPanel title="Order Information" className="shrink-0 bg-surface" contentClassName="overflow-visible">
        <OrderInfoSection order={order} layout="grid" />
      </SectionPanel>

      <SectionPanel
        title="Patient Information"
        className="shrink-0 bg-surface"
        contentClassName="overflow-visible"
        headerRight={
          patient && (
            <IconButton onClick={onViewPatient} variant="view" size="sm" title="View Patient" />
          )
        }
      >
        <PatientInfoSection patient={patient} onViewPatient={onViewPatient} layout="grid" />
      </SectionPanel>

      <SectionPanel
        title="Order Progress"
        className="shrink-0 bg-surface"
        contentClassName="overflow-visible p-0"
        headerClassName="!py-1.5"
        headerRight={<OrderCircularProgress order={order} />}
      >
        <OrderTimeline order={order} />
      </SectionPanel>

      <SectionPanel title={testsTitle} className="shrink-0 bg-surface" contentClassName="p-0 overflow-visible">
        <TestsTable
          tests={order.tests}
          orderId={order.orderId}
          supersededCount={supersededCount}
          variant="simple"
        />
      </SectionPanel>

      <SectionPanel
        title="Billing Summary"
        className="shrink-0 bg-surface"
        contentClassName="overflow-visible"
        headerRight={<PaymentPopover order={order} onSuccess={onPaymentSuccess} size="sm" />}
      >
        <BillingSummarySection order={order} invoice={invoice} onViewInvoice={onViewInvoice} />
      </SectionPanel>
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
