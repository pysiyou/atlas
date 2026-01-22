import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useOrders } from '@/features/order/OrderContext';
import { usePatients } from '@/hooks';
import { useBilling } from '@/features/billing/BillingContext';
import { useTests } from '@/features/test/TestsContext';
import { Button, Avatar, Badge, Icon, SectionContainer, IconButton, EmptyState } from '@/shared/ui';
import { formatCurrency, calculateAge } from '@/utils';
import { getTestName, getTestSampleType, getTestCategory } from '@/utils/typeHelpers';
import type { OrderTest } from '@/types';
import { OrderCircularProgress } from './OrderCircularProgress';
import { OrderTimeline } from './OrderTimeline';

export const OrderDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const ordersContext = useOrders();
  const patientsContext = usePatients();
  const billingContext = useBilling();
  const testsContext = useTests();

  if (!ordersContext || !patientsContext || !billingContext) {
    return <div>Loading...</div>;
  }

  const { getOrder } = ordersContext;
  const { getPatient } = patientsContext;
  const { getInvoiceByOrderId } = billingContext;
  const testCatalog = testsContext?.tests || [];

  const order = id ? getOrder(id) : null;
  const patient = order ? getPatient(order.patientId) : null;
  const invoice = order ? getInvoiceByOrderId(order.orderId) : null;

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Order not found</p>
      </div>
    );
  }

  // Calculate active vs superseded test counts for display
  // Superseded tests are those that have been replaced by retests after rejection
  const activeTests = order.tests.filter(t => t.status !== 'superseded');
  const supersededCount = order.tests.length - activeTests.length;

  // Note: Priority, status, and payment variants use the Badge component's built-in variants directly.
  // The Badge component has predefined styles for: 'stat', 'urgent', 'routine', 'ordered', 'in-progress',
  // 'completed', 'rejected', 'pending', 'paid', 'partial', etc.

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-bold text-gray-900">
                {order.orderId}
              </h1>
              <Badge variant={order.priority} size="sm" />
              <Badge variant={order.overallStatus} size="sm" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="print"
            size="sm"
            onClick={() => {/* Print functionality */}}
          >
            Print
          </Button>
          {invoice && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Icon name="bill" className="w-4 h-4" />}
              onClick={() => navigate(`/billing/invoice/${invoice.invoiceId}`)}
            >
              Invoice
            </Button>
          )}
         
        </div>
      </div>

      {/* Main Content - 2 Row Layout */}
      <div className="flex-1 grid grid-rows-[3fr_2fr] gap-4 min-h-0 h-full">

        {/* Row 1: Order Info, Patient Info, Order Progress (60% height) */}
        <div className="grid grid-cols-3 gap-4 min-h-0 h-full">
          {/* Order Information */}
          <SectionContainer title="Order Information" className="h-full flex flex-col min-h-0" contentClassName="flex-1 min-h-0 overflow-y-auto">
            <div className="flex flex-col gap-5">
              {/* Order ID */}
              <div className="flex gap-3 items-start">
                <Icon name="hashtag" className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Order ID</p>
                  <p className="text-xs font-medium text-gray-900 mt-0.5">{order.orderId}</p>
                </div>
              </div>

              {/* Order Date */}
              <div className="flex gap-3 items-start">
                <Icon name="calendar" className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Order Date</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {new Date(order.orderDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Priority */}
              <div className="flex gap-3 items-start">
                <Icon name="danger-square" className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Priority</p>
                  <div className="mt-0.5">
                    <Badge variant={order.priority} size="sm" />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex gap-3 items-start">
                <Icon name="clock" className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <div className="mt-0.5">
                    <Badge variant={order.overallStatus} size="sm" />
                  </div>
                </div>
              </div>

              {/* Referring Physician */}
              {order.referringPhysician && (
                <div className="flex gap-3 items-start">
                  <Icon name="stethoscope" className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Referring Physician</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{order.referringPhysician}</p>
                  </div>
                </div>
              )}

              {/* Clinical Notes */}
              {order.clinicalNotes && (
                <div className="flex gap-3 items-start">
                  <Icon name="pen" className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Clinical Notes</p>
                    <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{order.clinicalNotes}</p>
                  </div>
                </div>
              )}
            </div>
          </SectionContainer>

          {/* Patient Info Card */}
          <SectionContainer
            title="Patient Information"
            className="h-full flex flex-col min-h-0"
            contentClassName="flex-1 min-h-0 overflow-y-auto"
            headerClassName="!py-1.5"
            headerRight={
              <IconButton
                onClick={() => navigate(`/patients/${order.patientId}`)}
                variant="view"
                size="sm"
                title="View Patient"
              />
            }
          >
            {patient ? (
              <div className="flex flex-col gap-5">
                {/* Patient Name with Avatar */}
                <div className="flex gap-3 items-center">
                  <Avatar primaryText={patient.fullName} size="sm" className="" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{patient.fullName}</p>
                    <p className="text-xs text-gray-500">{patient.id}</p>
                  </div>
                </div>

                {/* Age & Gender */}
                <div className="flex gap-3 items-start">
                  <Icon name="user-hands" className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Age & Gender</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5 capitalize">
                      {calculateAge(patient.dateOfBirth)} years old • {patient.gender}
                    </p>
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="flex gap-3 items-start">
                  <Icon name="calendar" className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Date of Birth</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">
                      {new Date(patient.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex gap-3 items-start">
                  <Icon name="phone" className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{patient.phone}</p>
                  </div>
                </div>

                {/* Email */}
                {patient.email && (
                  <div className="flex gap-3 items-start">
                    <Icon name="mail" className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5 break-all">{patient.email}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <div className="w-12 h-12 flex items-center justify-center mb-3 opacity-50">
                  <Icon name="user" className="w-full h-full text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-400">Patient Not Found</p>
              </div>
            )}
          </SectionContainer>

          {/* Order Progress */}
          <SectionContainer
            title="Order Progress"
            className="h-full flex flex-col min-h-0"
            contentClassName="flex-1 min-h-0 overflow-y-auto p-0"
            headerClassName="!py-1.5"
            headerRight={<OrderCircularProgress order={order} />}
          >
            <OrderTimeline order={order} />
          </SectionContainer>
        </div>

        {/* Row 2: Tests and Billing Summary (40% height) */}
        <div className="grid grid-cols-3 gap-4 min-h-0 h-full">
          {/* Tests List - spans 2 columns to align with Row 1 */}
          <SectionContainer
            title={supersededCount > 0 
              ? `Tests (${activeTests.length} active)` 
              : `Tests (${order.tests.length})`
            }
            className="h-full flex flex-col col-span-2 min-h-0"
            contentClassName="flex-1 min-h-0 p-0 overflow-y-auto"
          >
            {order.tests.length === 0 ? (
              <EmptyState
                icon="health"
                title="No Tests"
                description="This order has no tests."
              />
            ) : (
              <table className="w-full text-left text-xs table-fixed">
                <colgroup>
                  <col style={{ width: '12%' }} /> {/* Test Code */}
                  <col style={{ width: '30%' }} /> {/* Test Name */}
                  <col style={{ width: '20%' }} /> {/* Category */}
                  <col style={{ width: '15%' }} /> {/* Sample Type */}
                  <col style={{ width: '15%' }} /> {/* Status */}
                  <col style={{ width: '8%' }} /> {/* Price */}
                </colgroup>
                <thead className="bg-gray-50 text-gray-500 uppercase sticky top-0 z-10 [&_th]:font-normal">
                  <tr>
                    <th className="px-4 py-2">Code</th>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2">Sample</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.tests.map((test: OrderTest, index: number) => {
                    const testName = getTestName(test.testCode, testCatalog);
                    const sampleType = getTestSampleType(test.testCode, testCatalog);
                    const category = getTestCategory(test.testCode, testCatalog);
                    
                    // Check if this test has been superseded (replaced by a retest)
                    const isSuperseded = test.status === 'superseded';
                    // Check if this is a retest of a previous test
                    const isRetest = test.isRetest || false;
                    const retestNumber = test.retestNumber || 0;

                    return (
                      <tr 
                        key={test.id || index} 
                        className={`transition-colors ${
                          isSuperseded 
                            ? 'bg-gray-50/50 opacity-60' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {/* Test Code */}
                        <td className={`px-4 py-3 font-mono truncate whitespace-nowrap ${
                          isSuperseded ? 'text-gray-400 line-through' : 'text-sky-600'
                        }`}>
                          {test.testCode}
                        </td>
                        
                        {/* Test Name with Retest Badge */}
                        <td className={`px-4 py-3 whitespace-normal wrap-break-word ${
                          isSuperseded ? 'line-through' : ''
                        }`}>
                          <div className="flex items-center gap-1">
                            <span className={`font-medium ${
                              isSuperseded ? 'text-gray-400' : 'text-gray-900'
                            }`}>
                              {testName}
                            </span>
                            {/* Show retest indicator for retests */}
                            {isRetest && retestNumber > 0 && (
                              <Badge variant="default" size="xs" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                                #{retestNumber}
                              </Badge>
                            )}
                          </div>
                        </td>
                        
                        {/* Category */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={category as 'default'} size="sm" strikethrough={isSuperseded} />
                        </td>
                        
                        {/* Sample Type */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={sampleType as 'default'} size="sm" strikethrough={isSuperseded} />
                        </td>
                        
                        {/* Status */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={test.status} size="sm" strikethrough={isSuperseded} />
                        </td>
                        
                        {/* Price */}
                        <td className={`px-4 py-3 text-right font-medium whitespace-nowrap ${
                          isSuperseded ? 'text-gray-400 line-through' : 'text-sky-600'
                        }`}>
                          {formatCurrency(test.priceAtOrder)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </SectionContainer>

          {/* Billing Summary */}
          <SectionContainer title="Billing Summary" className="h-full flex flex-col min-h-0" contentClassName="flex-1 min-h-0 flex flex-col justify-between">
            <div className="space-y-3">
              {/* Subtotal */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-900">{formatCurrency(order.totalPrice)}</span>
              </div>

              {/* Discount - if any */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Discount</span>
                <span className="font-medium text-gray-900">-</span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-3" />

            {/* Total & Payment Status */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-sky-600">{formatCurrency(order.totalPrice)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Payment Status</span>
                <Badge variant={order.paymentStatus} size="sm" />
              </div>
            </div>

            {/* Invoice Button */}
            {invoice && (
              <Button
                variant="secondary"
                size="sm"
                className="w-full mt-4"
                icon={<Icon name="bill" className="w-4 h-4" />}
                onClick={() => navigate(`/billing/invoice/${invoice.invoiceId}`)}
              >
                View Invoice
              </Button>
            )}
          </SectionContainer>
        </div>
      </div>
    </div>
  );
};


