/**
 * OrderDetail Component
 * Main component for displaying order details with responsive layouts
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useResponsiveLayout } from '@/hooks';
import { useOrder, usePatient, useTestCatalog, usePaymentsByOrder } from '@/hooks/queries';
import type { Invoice } from '@/types';
import {
  OrderHeader,
  SmallScreenLayout,
  MediumScreenLayout,
  LargeScreenLayout,
} from './components';

export const OrderDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isSmall, isMedium, isLarge } = useResponsiveLayout();

  // Use TanStack Query hooks
  const { order, isLoading: orderLoading } = useOrder(id);
  const { patient: patientData, isLoading: patientLoading } = usePatient(
    order?.patientId.toString()
  );
  const { tests: testCatalog, isLoading: testsLoading } = useTestCatalog();
  const { isLoading: paymentsLoading } = usePaymentsByOrder(id);

  // Normalize patient to Patient | null (not undefined)
  const patient = patientData ?? null;

  // Invoice data - currently not available from API
  // TODO: Add invoice API endpoint when available
  const invoice: Invoice | null = null;

  // Loading state
  if (orderLoading || patientLoading || testsLoading || paymentsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center py-12">
          <p className="text-gray-600">Order not found</p>
        </div>
      </div>
    );
  }

  // Calculate active vs superseded test counts for display
  const activeTests = order.tests.filter(t => t.status !== 'superseded');
  const supersededCount = order.tests.length - activeTests.length;

  // Event handlers
  const handleViewPatient = () => navigate(`/patients/${order.patientId}`);
  const handleViewInvoice = () => {
    // Invoice functionality not yet available
    // TODO: Implement when invoice API is ready
  };

  // Render appropriate layout based on screen size
  const renderContent = () => {
    const layoutProps = {
      order,
      patient,
      invoice,
      testCatalog,
      activeTests,
      supersededCount,
      onViewPatient: handleViewPatient,
      onViewInvoice: handleViewInvoice,
    };

    if (isSmall) {
      return <SmallScreenLayout {...layoutProps} />;
    }

    if (isMedium) {
      return <MediumScreenLayout {...layoutProps} />;
    }

    return <LargeScreenLayout {...layoutProps} />;
  };

  return (
    <div className="h-full flex flex-col p-6 transition-all duration-300">
      <OrderHeader
        order={order}
        invoice={invoice}
        isLarge={isLarge}
        onViewInvoice={handleViewInvoice}
      />

      {renderContent()}
    </div>
  );
};
