/**
 * Order Detail Layout Components
 * Responsive layouts for order detail page
 */

import React, { useCallback, useMemo, useState } from 'react';
import { actionButtonPreset, IconButton } from '@/components/primitives';
import { Panel } from '@/components/surfaces';
import { LAYOUT, SPACING } from '@/theme/recipes';
import { cn } from '@/utils';
import {
  PaymentDetailModal,
  PaymentPopover,
  usePaymentsByOrder,
  type OrderPaymentView,
} from '@/features/payments';
import type { Order, OrderTest, Patient, Invoice } from '@/types';
import { OrderInfoSection } from './OrderInfoSection';
import { PatientInfoSection } from './PatientInfoSection';
import { TestsTable } from './TestsTable';
import { BillingSummarySection } from './BillingSummarySection';
import { OrderEventLogPanel } from '@/features/audit';

interface LayoutProps {
  loading?: boolean;
  order?: Order;
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
  onPaymentSuccess,
}: {
  order: Order;
  onPaymentSuccess?: () => void;
}) {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const { payments } = usePaymentsByOrder(String(order.orderId));
  const isPaid = order.paymentStatus === 'paid';

  const paymentView: OrderPaymentView = useMemo(() => {
    const latestPayment = payments[0];
    return {
      order,
      paymentMethod:
        latestPayment?.paymentMethod ??
        (order.paymentStatus !== 'unpaid' ? order.paymentMethod : undefined),
      paymentDate: latestPayment?.paidAt,
    };
  }, [order, payments]);

  const handleOpenPaymentModal = useCallback(() => {
    setPaymentModalOpen(true);
  }, []);

  const handleClosePaymentModal = useCallback(() => {
    setPaymentModalOpen(false);
  }, []);

  const handlePaymentModalSuccess = useCallback(() => {
    onPaymentSuccess?.();
    setPaymentModalOpen(false);
  }, [onPaymentSuccess]);

  return (
    <>
      <div className={`flex items-center ${SPACING.gapInline}`}>
        <IconButton
          {...actionButtonPreset('view')}
          size="sm"
          title="View payment"
          onClick={handleOpenPaymentModal}
        />
        {!isPaid && <PaymentPopover order={order} onSuccess={onPaymentSuccess} size="sm" />}
      </div>
      <PaymentDetailModal
        isOpen={paymentModalOpen}
        onClose={handleClosePaymentModal}
        order={paymentModalOpen ? paymentView : null}
        onPaymentSuccess={handlePaymentModalSuccess}
      />
    </>
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
  loading = false,
  order,
  patient,
  activeTests,
  supersededCount,
  removedCount,
  onViewPatient,
  onPaymentSuccess,
  testsVariant,
  fillHeight,
}) => {
  const testsHeaderMeta =
    order != null
      ? getTestsHeaderMeta(
          order.tests?.length ?? activeTests.length,
          supersededCount,
          removedCount
        )
      : undefined;
  const patientHeaderEnd =
    !loading && patient ? (
      <IconButton onClick={onViewPatient} {...actionButtonPreset('view')} size="sm" title="View Patient" />
    ) : undefined;
  const billingHeaderEnd =
    !loading && order ? (
      <BillingSummaryPanelActions order={order} onPaymentSuccess={onPaymentSuccess} />
    ) : undefined;

  return (
    <>
      <div className={cn(LAYOUT.detailGrid3, fillHeight && 'min-h-0')}>
        <Panel
          preset={fillHeight ? 'panel.page.auto.fill' : 'panel.page.visible'}
          title="Order Information"
          loading={loading}
          loadingShape="fields"
          loadingRows={6}
        >
          {order ? <OrderInfoSection order={order} /> : null}
        </Panel>

        <Panel
          preset={fillHeight ? 'panel.page.auto.fill' : 'panel.page.visible'}
          title="Patient Information"
          loading={loading}
          loadingShape="fields"
          loadingRows={6}
          loadingHeaderAside={!loading && Boolean(patientHeaderEnd)}
          headerEnd={patientHeaderEnd}
        >
          <PatientInfoSection patient={patient} onViewPatient={onViewPatient} />
        </Panel>

        <Panel
          preset={fillHeight ? 'panel.pageEmbed.auto.fill.flexColumnMin' : 'panel.pageEmbed.visible'}
          title="Order activity"
          loading={loading}
          loadingShape="list"
          loadingRows={4}
        >
          {order ? (
            <OrderEventLogPanel
              orderId={order.orderId}
              layout="embedded"
              className={fillHeight ? 'min-h-0 flex-1' : undefined}
            />
          ) : null}
        </Panel>
      </div>

      <div className={cn(LAYOUT.detailGrid3, fillHeight && 'min-h-0')}>
        <Panel
          preset={fillHeight ? 'panel.pageEmbed.span2Fill' : 'panel.pageEmbed.span2'}
          title="Tests"
          meta={testsHeaderMeta}
          loading={loading}
          loadingShape="table"
          loadingTableColumns={5}
          loadingTableRows={5}
        >
          {order ? (
            <TestsTable
              tests={order.tests ?? []}
              order={order}
              patient={patient}
              variant={testsVariant}
            />
          ) : null}
        </Panel>

        <Panel
          preset={fillHeight ? 'panel.pageEmbed.auto.fill.flexColumn' : 'panel.pageEmbed.visible.flexColumn'}
          title="Billing Summary"
          loading={loading}
          loadingShape="fields"
          loadingRows={4}
          loadingHeaderAside={!loading && Boolean(billingHeaderEnd)}
          headerEnd={billingHeaderEnd}
        >
          {order ? <BillingSummarySection order={order} /> : null}
        </Panel>
      </div>
    </>
  );
};

/**
 * SmallScreenLayout - Single column stack for small screens.
 */
export const SmallScreenLayout: React.FC<LayoutProps> = props => {
  const {
    loading = false,
    order,
    patient,
    activeTests,
    supersededCount,
    removedCount,
    onViewPatient,
    onPaymentSuccess,
  } = props;
  const testsHeaderMeta =
    order != null
      ? getTestsHeaderMeta(
          order.tests?.length ?? activeTests.length,
          supersededCount,
          removedCount
        )
      : undefined;
  const patientHeaderEnd =
    !loading && patient ? (
      <IconButton onClick={onViewPatient} {...actionButtonPreset('view')} size="sm" title="View Patient" />
    ) : undefined;
  const billingHeaderEnd =
    !loading && order ? (
      <BillingSummaryPanelActions order={order} onPaymentSuccess={onPaymentSuccess} />
    ) : undefined;

  return (
    <div className={LAYOUT.detailScroll}>
      <Panel
        preset="panel.page.visible.shrink"
        title="Order Information"
        loading={loading}
        loadingShape="fields"
        loadingRows={6}
      >
        {order ? <OrderInfoSection order={order} /> : null}
      </Panel>

      <Panel
        preset="panel.page.visible.shrink"
        title="Patient Information"
        loading={loading}
        loadingShape="fields"
        loadingRows={6}
        loadingHeaderAside={!loading && Boolean(patientHeaderEnd)}
        headerEnd={patientHeaderEnd}
      >
        <PatientInfoSection patient={patient} onViewPatient={onViewPatient} />
      </Panel>

      <Panel
        preset="panel.pageEmbed.stackMinHeight"
        title="Order activity"
        loading={loading}
        loadingShape="list"
        loadingRows={4}
      >
        {order ? <OrderEventLogPanel orderId={order.orderId} layout="embedded" /> : null}
      </Panel>

      <Panel
        preset="panel.pageEmbed.visible.shrink"
        title="Tests"
        meta={testsHeaderMeta}
        loading={loading}
        loadingShape="table"
        loadingTableColumns={5}
        loadingTableRows={5}
      >
        {order ? (
          <TestsTable
            tests={order.tests ?? []}
            order={order}
            patient={patient}
            variant="simple"
          />
        ) : null}
      </Panel>

      <Panel
        preset="panel.pageEmbed.visible.shrink.flexColumn"
        title="Billing Summary"
        loading={loading}
        loadingShape="fields"
        loadingRows={4}
        loadingHeaderAside={!loading && Boolean(billingHeaderEnd)}
        headerEnd={billingHeaderEnd}
      >
        {order ? <BillingSummarySection order={order} /> : null}
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
