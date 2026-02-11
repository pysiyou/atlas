/**
 * OrderDetail Component
 * Main component for displaying order details with responsive layouts
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useResponsiveLayout } from '@/hooks';
import { useOrder, usePatient } from '@/hooks/queries';
import { getActiveTests } from '@/utils/orderUtils';
import { useModal, ModalType } from '@/shared/context/ModalContext';
import type { Invoice } from '@/types';
import { DetailPageShell, DetailPageHeader } from '@/shared/components';
import { OrderHeader } from '../components/OrderHeader';
import {
  SmallScreenLayout,
  MediumScreenLayout,
  LargeScreenLayout,
} from '../components/OrderDetailLayouts';

export const OrderDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isSmall, isMedium, isLarge } = useResponsiveLayout();
  const { openModal } = useModal();

  const { order, isLoading: orderLoading } = useOrder(id);
  const { patient: patientData, isLoading: patientLoading } = usePatient(
    order?.patientId.toString()
  );
  const patient = patientData ?? null;
  const invoice: Invoice | null = null;

  const activeTests = order != null ? getActiveTests(order.tests) : [];
  const supersededCount = order != null ? order.tests.length - activeTests.length : 0;

  const handleViewPatient = () => navigate(`/patients/${order?.patientId}`);
  const handleViewInvoice = () => { /* Stubbed until API */ };
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
      onViewPatient: handleViewPatient,
      onViewInvoice: handleViewInvoice,
    };
    if (isSmall) return <SmallScreenLayout {...layoutProps} />;
    if (isMedium) return <MediumScreenLayout {...layoutProps} />;
    return <LargeScreenLayout {...layoutProps} />;
  };

  const header = order != null ? (
    <OrderHeader
      order={order}
      invoice={invoice}
      isLarge={isLarge}
      onViewInvoice={handleViewInvoice}
      onEdit={order.overallStatus === 'ordered' ? handleEdit : undefined}
    />
  ) : (
    <DetailPageHeader title="Order" />
  );

  return (
    <DetailPageShell
      header={header}
      loading={orderLoading || patientLoading}
      loadingMessage="Loading order..."
      notFound={!order}
      notFoundTitle="Order Not Found"
      notFoundDescription="The order could not be found."
    >
      {renderContent()}
    </DetailPageShell>
  );
};
