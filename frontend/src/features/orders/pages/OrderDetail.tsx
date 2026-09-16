/**
 * OrderDetail Component
 * Main component for displaying order details with responsive layouts
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { usePatient } from '@/features/patients';
import { useOrder } from '../api/orders.api';
import { getActiveTests } from '@/features/orders/utils';
import { notify } from '@/utils/feedback';
import { useModal, ModalType } from '@/lib/context/ModalContext';
import { formatCurrency, displayId } from '@/utils';
import type { Invoice } from '@/types';
import { useOrderInvoices } from '@/features/billing/api/billing.hooks';
import { DetailPageShell, PageHeader } from '@/components';
import { OrderHeader } from '../components/OrderHeader';
import {
  SmallScreenLayout,
  MediumScreenLayout,
  LargeScreenLayout,
} from '../components/OrderDetailLayouts';
import { DetailPageSkeleton } from '@/components/loaders/DetailPageSkeleton';
import {
  ORDER_DETAIL_SKELETON_SECTIONS,
  renderOrderDetailLargeSkeleton,
} from '../config/OrderDetailSkeleton';

export const OrderDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isSmall, isMedium, isLarge } = useResponsiveLayout();
  const { openModal } = useModal();

  const { order, isLoading: orderLoading } = useOrder(id);
  const orderIdNum = order?.orderId;
  const { invoices } = useOrderInvoices(orderIdNum);
  const { patient: patientData, isLoading: patientLoading } = usePatient(
    order?.patientId.toString()
  );
  const patient = patientData ?? null;
  const invoice: Invoice | null = invoices[0]
    ? {
        invoiceId: invoices[0].invoiceId,
        orderId: invoices[0].orderId,
        patientId: invoices[0].patientId,
        patientName: invoices[0].patientName,
        status: invoices[0].paymentStatus === 'paid' ? 'paid' : 'unpaid',
        items: invoices[0].items,
        subtotal: invoices[0].subtotal,
        discount: invoices[0].discount,
        tax: invoices[0].tax,
        total: invoices[0].total,
        amountPaid: invoices[0].amountPaid,
        amountDue: invoices[0].amountDue,
        createdAt: invoices[0].createdAt,
        dueDate: invoices[0].dueDate ?? undefined,
      }
    : null;

  const activeTests = order != null ? getActiveTests(order.tests) : [];
  // Count tests that are not shown: removed, and optionally superseded (shown with reduced opacity)
  const removedCount = order != null ? order.tests.filter(t => t.status === 'removed').length : 0;
  const supersededCount = order != null ? order.tests.filter(t => t.status === 'superseded').length : 0;

  const handleViewPatient = () => navigate(`/patients/${order?.patientId}`);
  const handleViewInvoice = () => {
    if (!invoice) return;
    notify.toast('order.invoice.preview', {
      subtitle: `${displayId.invoice(invoice.invoiceId)} — ${formatCurrency(invoice.total)} (${invoice.status})`,
    });
  };
  const handleEdit = () => {
    if (order?.overallStatus === 'ordered') {
      openModal(ModalType.NEW_ORDER, { order, mode: 'edit' });
    }
  };

  const renderContent = () => {
    if (order == null || patient === undefined) return null;
    const layoutProps = {
      order,
      patient,
      invoice,
      activeTests,
      supersededCount,
      removedCount,
      onViewPatient: handleViewPatient,
      onViewInvoice: handleViewInvoice,
    };
    if (isSmall) return <SmallScreenLayout {...layoutProps} />;
    if (isMedium) return <MediumScreenLayout {...layoutProps} />;
    return <LargeScreenLayout {...layoutProps} />;
  };

  const header =
    order != null ? (
      <OrderHeader
        order={order}
        invoice={invoice}
        isLarge={isLarge}
        onViewInvoice={handleViewInvoice}
        onEdit={order.overallStatus === 'ordered' ? handleEdit : undefined}
      />
    ) : (
      <PageHeader title="Order" />
    );

  return (
    <DetailPageShell
      header={header}
      loading={orderLoading || patientLoading}
      loadingMessage="Loading order..."
      loadingSkeleton={
        <DetailPageSkeleton
          sections={ORDER_DETAIL_SKELETON_SECTIONS}
          renderLargeLayout={renderOrderDetailLargeSkeleton}
          aria-label="Loading order"
        />
      }
      notFound={!order}
      notFoundTitle="Order Not Found"
      notFoundDescription="The order could not be found."
    >
      {renderContent()}
    </DetailPageShell>
  );
};
