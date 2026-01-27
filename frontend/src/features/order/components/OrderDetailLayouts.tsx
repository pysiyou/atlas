/**
 * Order Detail Layout Components
 * Responsive layouts for order detail page
 */

import React from 'react';
import { SectionContainer, IconButton } from '@/shared/ui';
import { PaymentPopover } from '@/features/payment/components/filters/PaymentPopover';
import type { Order, OrderTest, Patient, Test, Invoice } from '@/types';
import { OrderInfoSection } from './display/OrderInfoSection';
import { PatientInfoSection } from './display/PatientInfoSection';
import { TestsTable } from './display/TestsTable';
import { BillingSummarySection } from './display/BillingSummarySection';
import { OrderCircularProgress } from './OrderCircularProgress';
import { OrderTimeline } from './display/OrderTimeline';

interface LayoutProps {
  order: Order;
  patient: Patient | null;
  invoice: Invoice | null;
  testCatalog: Test[];
  activeTests: OrderTest[];
  supersededCount: number;
  onViewPatient: () => void;
  onViewInvoice: () => void;
  /** Callback invoked on successful payment */
  onPaymentSuccess?: () => void;
}

/**
 * SmallScreenLayout - Single column stack layout for small screens
 */
export const SmallScreenLayout: React.FC<LayoutProps> = ({
  order,
  patient,
  invoice,
  testCatalog,
  activeTests,
  supersededCount,
  onViewPatient,
  onViewInvoice,
  onPaymentSuccess,
}) => {
  return (
    <div className="flex-1 flex flex-col gap-5 overflow-y-auto pb-6">
      <SectionContainer
        title="Order Information"
        className="shrink-0 bg-surface"
        contentClassName="overflow-visible"
      >
        <OrderInfoSection order={order} layout="grid" />
      </SectionContainer>

      <SectionContainer
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
      </SectionContainer>

      <SectionContainer
        title="Order Progress"
        className="shrink-0 bg-surface"
        contentClassName="overflow-visible p-0"
        headerClassName="!py-1.5"
        headerRight={<OrderCircularProgress order={order} />}
      >
        <OrderTimeline order={order} />
      </SectionContainer>

      <SectionContainer
        title={
          supersededCount > 0
            ? `Tests (${activeTests.length} active)`
            : `Tests (${order.tests.length})`
        }
        className="shrink-0"
        contentClassName="p-0 overflow-visible"
      >
        <TestsTable
          tests={order.tests}
          testCatalog={testCatalog}
          supersededCount={supersededCount}
          variant="simple"
        />
      </SectionContainer>

      <SectionContainer
        title="Billing Summary"
        className="shrink-0 bg-surface"
        contentClassName="overflow-visible"
        headerRight={<PaymentPopover order={order} onSuccess={onPaymentSuccess} size="sm" />}
      >
        <BillingSummarySection order={order} invoice={invoice} onViewInvoice={onViewInvoice} />
      </SectionContainer>
    </div>
  );
};

/**
 * MediumScreenLayout - 2x2 grid layout for medium screens
 */
export const MediumScreenLayout: React.FC<LayoutProps> = ({
  order,
  patient,
  invoice,
  testCatalog,
  activeTests,
  supersededCount,
  onViewPatient,
  onViewInvoice,
  onPaymentSuccess,
}) => {
  return (
    <div className="flex-1 grid grid-cols-2 grid-rows-3 gap-4 min-h-0 h-full">
      <SectionContainer
        title="Order Information"
        className="h-full flex flex-col min-h-0 bg-surface"
        contentClassName="flex-1 min-h-0 overflow-y-auto"
      >
        <OrderInfoSection order={order} layout="column" />
      </SectionContainer>

      <SectionContainer
        title="Patient Information"
        className="h-full flex flex-col min-h-0 bg-surface"
        contentClassName="flex-1 min-h-0 overflow-y-auto"
        headerClassName="!py-1.5"
        headerRight={
          patient && (
            <IconButton onClick={onViewPatient} variant="view" size="sm" title="View Patient" />
          )
        }
      >
        <PatientInfoSection patient={patient} onViewPatient={onViewPatient} layout="column" />
      </SectionContainer>

      <SectionContainer
        title="Order Progress"
        className="h-full flex flex-col min-h-0 bg-surface"
        contentClassName="flex-1 min-h-0 overflow-y-auto p-0"
        headerClassName="!py-1.5"
        headerRight={<OrderCircularProgress order={order} />}
      >
        <OrderTimeline order={order} />
      </SectionContainer>

      <SectionContainer
        title="Billing Summary"
        className="h-full flex flex-col min-h-0 bg-surface"
        contentClassName="flex-1 min-h-0 overflow-y-auto flex flex-col"
        headerRight={<PaymentPopover order={order} onSuccess={onPaymentSuccess} size="sm" />}
      >
        <BillingSummarySection order={order} invoice={invoice} onViewInvoice={onViewInvoice} />
      </SectionContainer>

      <SectionContainer
        title={
          supersededCount > 0
            ? `Tests (${activeTests.length} active)`
            : `Tests (${order.tests.length})`
        }
        className="h-full flex flex-col min-h-0 bg-surface col-span-2"
        contentClassName="flex-1 min-h-0 p-0 overflow-y-auto"
      >
        <TestsTable
          tests={order.tests}
          testCatalog={testCatalog}
          supersededCount={supersededCount}
          variant="detailed"
        />
      </SectionContainer>
    </div>
  );
};

/**
 * LargeScreenLayout - 3-column grid layout for large screens
 */
export const LargeScreenLayout: React.FC<LayoutProps> = ({
  order,
  patient,
  invoice,
  testCatalog,
  activeTests,
  supersededCount,
  onViewPatient,
  onViewInvoice,
  onPaymentSuccess,
}) => {
  return (
    <div
      className="flex-1 grid grid-cols-3 gap-4 min-h-0 h-full"
      style={{ height: '100%', maxHeight: '100%', overflow: 'hidden' }}
    >
      <div
        className="col-span-2 grid grid-cols-2 grid-rows-[1fr_1fr] gap-4 min-h-0 h-full"
        style={{ height: '100%', maxHeight: '100%', overflow: 'hidden' }}
      >
        <SectionContainer
          title="Order Information"
          className="h-full flex flex-col min-h-0"
          contentClassName="flex-1 min-h-0 overflow-y-auto"
        >
          <OrderInfoSection order={order} layout="column" />
        </SectionContainer>

        <SectionContainer
          title="Patient Information"
          className="h-full flex flex-col min-h-0"
          contentClassName="flex-1 min-h-0 overflow-y-auto"
          headerClassName="!py-1.5"
          headerRight={
            patient && (
              <IconButton onClick={onViewPatient} variant="view" size="sm" title="View Patient" />
            )
          }
        >
          <PatientInfoSection patient={patient} onViewPatient={onViewPatient} layout="column" />
        </SectionContainer>

        <SectionContainer
          title={
            supersededCount > 0
              ? `Tests (${activeTests.length} active)`
              : `Tests (${order.tests.length})`
          }
          className="h-full flex flex-col col-span-2 min-h-0"
          contentClassName="flex-1 min-h-0 p-0 overflow-y-auto"
        >
          <TestsTable
            tests={order.tests}
            testCatalog={testCatalog}
            supersededCount={supersededCount}
            variant="detailed"
          />
        </SectionContainer>
      </div>

      <div
        className="col-span-1 grid grid-rows-[1fr_1fr] gap-4 min-h-0 h-full"
        style={{ height: '100%', maxHeight: '100%', overflow: 'hidden' }}
      >
        <SectionContainer
          title="Order Progress"
          className="h-full flex flex-col min-h-0"
          contentClassName="flex-1 min-h-0 overflow-y-auto p-0"
          headerClassName="!py-1.5"
          headerRight={<OrderCircularProgress order={order} />}
        >
          <OrderTimeline order={order} />
        </SectionContainer>

        <SectionContainer
          title="Billing Summary"
          className="h-full flex flex-col min-h-0"
          contentClassName="flex-1 min-h-0 overflow-y-auto flex flex-col"
          headerRight={<PaymentPopover order={order} onSuccess={onPaymentSuccess} size="sm" />}
        >
          <BillingSummarySection order={order} invoice={invoice} onViewInvoice={onViewInvoice} />
        </SectionContainer>
      </div>
    </div>
  );
};
