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
import { AuditHistorySection } from '@/features/lab/components/AuditHistorySection';

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

/**
 * SmallScreenLayout - Single column stack layout for small screens.
 * Uses theme tokens (bg-surface-page, bg-surface) so theme applies correctly.
 */
export const SmallScreenLayout: React.FC<LayoutProps> = ({
  order,
  patient,
  invoice,
  activeTests,
  supersededCount,
  onViewPatient,
  onViewInvoice,
  onPaymentSuccess,
}) => {
  const relatedTestIds = order.tests.map(t => t.id).filter((id): id is number => typeof id === 'number');
  const relatedSampleIds = [
    ...new Set(
      order.tests.map(t => t.sampleId).filter((id): id is number => typeof id === 'number')
    ),
  ];

  return (
    <div className="flex-1 flex flex-col gap-5 overflow-y-auto pb-6 bg-surface-page">
      <SectionPanel
        title="Order Information"
        className="shrink-0 bg-surface"
        contentClassName="overflow-visible"
      >
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

      <SectionPanel
        title={
          supersededCount > 0
            ? `Tests (${activeTests.length} active)`
            : `Tests (${order.tests.length})`
        }
        className="shrink-0 bg-surface"
        contentClassName="p-0 overflow-visible"
      >
        <TestsTable tests={order.tests} orderId={order.orderId} supersededCount={supersededCount} variant="simple" />
      </SectionPanel>

      <SectionPanel
        title="Billing Summary"
        className="shrink-0 bg-surface"
        contentClassName="overflow-visible"
        headerRight={<PaymentPopover order={order} onSuccess={onPaymentSuccess} size="sm" />}
      >
        <BillingSummarySection order={order} invoice={invoice} onViewInvoice={onViewInvoice} />
      </SectionPanel>

      <AuditHistorySection
        entityType="order"
        entityId={order.orderId}
        relatedTestIds={relatedTestIds}
        relatedSampleIds={relatedSampleIds}
      />
    </div>
  );
};

/**
 * MediumScreenLayout - 2x2 grid + full-width row for medium screens.
 * Rows use content height; page scrolls when content exceeds viewport.
 */
export const MediumScreenLayout: React.FC<LayoutProps> = ({
  order,
  patient,
  invoice,
  activeTests,
  supersededCount,
  onViewPatient,
  onViewInvoice,
  onPaymentSuccess,
}) => {
  const relatedTestIds = order.tests.map(t => t.id).filter((id): id is number => typeof id === 'number');
  const relatedSampleIds = [
    ...new Set(
      order.tests.map(t => t.sampleId).filter((id): id is number => typeof id === 'number')
    ),
  ];

  return (
    <div className="grid grid-cols-2 gap-4 w-full pb-6">
      <SectionPanel
        title="Order Information"
        className="bg-surface"
        contentClassName="overflow-visible"
      >
        <OrderInfoSection order={order} layout="column" />
      </SectionPanel>

      <SectionPanel
        title="Patient Information"
        className="bg-surface"
        contentClassName="overflow-visible"
        headerClassName="!py-1.5"
        headerRight={
          patient && (
            <IconButton onClick={onViewPatient} variant="view" size="sm" title="View Patient" />
          )
        }
      >
        <PatientInfoSection patient={patient} onViewPatient={onViewPatient} layout="column" />
      </SectionPanel>

      <SectionPanel
        title="Order Progress"
        className="bg-surface"
        contentClassName="overflow-visible p-0"
        headerClassName="!py-1.5"
        headerRight={<OrderCircularProgress order={order} />}
      >
        <OrderTimeline order={order} />
      </SectionPanel>

      <SectionPanel
        title="Billing Summary"
        className="bg-surface"
        contentClassName="overflow-visible flex flex-col"
        headerRight={<PaymentPopover order={order} onSuccess={onPaymentSuccess} size="sm" />}
      >
        <BillingSummarySection order={order} invoice={invoice} onViewInvoice={onViewInvoice} />
      </SectionPanel>

      <SectionPanel
        title={
          supersededCount > 0
            ? `Tests (${activeTests.length} active)`
            : `Tests (${order.tests.length})`
        }
        className="bg-surface col-span-2"
        contentClassName="p-0 overflow-visible"
      >
        <TestsTable tests={order.tests} orderId={order.orderId} supersededCount={supersededCount} variant="detailed" />
      </SectionPanel>

      <AuditHistorySection
        className="col-span-2"
        entityType="order"
        entityId={order.orderId}
        relatedTestIds={relatedTestIds}
        relatedSampleIds={relatedSampleIds}
      />
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
  activeTests,
  supersededCount,
  onViewPatient,
  onViewInvoice,
  onPaymentSuccess,
}) => {
  const relatedTestIds = order.tests.map(t => t.id).filter((id): id is number => typeof id === 'number');
  const relatedSampleIds = [
    ...new Set(
      order.tests.map(t => t.sampleId).filter((id): id is number => typeof id === 'number')
    ),
  ];

  return (
    <div
      className="flex-1 grid grid-cols-3 gap-4 min-h-0 h-full"
      style={{ height: '100%', maxHeight: '100%', overflow: 'hidden' }}
    >
      <div
        className="col-span-2 grid grid-cols-2 grid-rows-[1fr_1fr] gap-4 min-h-0 h-full"
        style={{ height: '100%', maxHeight: '100%', overflow: 'hidden' }}
      >
        <SectionPanel
          title="Order Information"
          className="h-full flex flex-col min-h-0"
          contentClassName="flex-1 min-h-0 overflow-y-auto"
        >
          <OrderInfoSection order={order} layout="column" />
        </SectionPanel>

        <SectionPanel
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
        </SectionPanel>

        <SectionPanel
          title={
            supersededCount > 0
              ? `Tests (${activeTests.length} active)`
              : `Tests (${order.tests.length})`
          }
          className="h-full flex flex-col col-span-2 min-h-0"
          contentClassName="flex-1 min-h-0 p-0 overflow-y-auto"
        >
          <TestsTable tests={order.tests} orderId={order.orderId} supersededCount={supersededCount} variant="detailed" />
        </SectionPanel>
      </div>

      <div
        className="col-span-1 flex flex-col gap-4 min-h-0 h-full overflow-y-auto"
        style={{ height: '100%', maxHeight: '100%' }}
      >
        <SectionPanel
          title="Order Progress"
          className="shrink-0 flex flex-col min-h-0"
          contentClassName="overflow-y-auto p-0"
          headerClassName="!py-1.5"
          headerRight={<OrderCircularProgress order={order} />}
        >
          <OrderTimeline order={order} />
        </SectionPanel>

        <SectionPanel
          title="Billing Summary"
          className="shrink-0 flex flex-col min-h-0"
          contentClassName="overflow-y-auto flex flex-col"
          headerRight={<PaymentPopover order={order} onSuccess={onPaymentSuccess} size="sm" />}
        >
          <BillingSummarySection order={order} invoice={invoice} onViewInvoice={onViewInvoice} />
        </SectionPanel>

        <AuditHistorySection
          entityType="order"
          entityId={order.orderId}
          relatedTestIds={relatedTestIds}
          relatedSampleIds={relatedSampleIds}
        />
      </div>
    </div>
  );
};
