/**
 * OrderDetail Component
 * Main component for displaying order details with responsive layouts
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useOrders } from '@/features/order/OrderContext';
import { usePatients, useResponsiveLayout } from '@/hooks';
import { useBilling } from '@/features/billing/BillingContext';
import { useTests } from '@/features/test/TestsContext';
import {
  OrderHeader,
  SmallScreenLayout,
  MediumScreenLayout,
  LargeScreenLayout,
} from './components';

export const OrderDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const ordersContext = useOrders();
  const patientsContext = usePatients();
  const billingContext = useBilling();
  const testsContext = useTests();
  const { isSmall, isMedium, isLarge } = useResponsiveLayout();

  // Early returns for loading and error states
  if (!ordersContext || !patientsContext || !billingContext) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const { getOrder } = ordersContext;
  const { getPatient } = patientsContext;
  const { getInvoiceByOrderId } = billingContext;
  const testCatalog = testsContext?.tests || [];

  const order = id ? getOrder(id) : null;
  const patient = order ? (getPatient(order.patientId) ?? null) : null;
  const invoice = order ? getInvoiceByOrderId(order.orderId) : null;

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
  const handleViewInvoice = () => invoice && navigate(`/billing/invoice/${invoice.invoiceId}`);

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
