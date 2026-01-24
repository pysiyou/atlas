/**
 * Order Detail Components
 * Consolidates small order detail components used together:
 * - OrderHeader: Order header display with badges
 * - OrderMetadata: Patient metadata display
 * - BillingSummaryCard: Billing summary card
 * - TestListCard: Test list display
 */

import React from 'react';
import { SectionContainer, Badge, Avatar } from '@/shared/ui';
import { formatDate, formatCurrency } from '@/utils';
import { displayId } from '@/utils/id-display';
import type { OrderTest, PaymentStatus } from '@/types';

// ============================================================================
// OrderCardHeader Component (Simple header for OrderCard)
// ============================================================================

interface OrderCardHeaderProps {
  orderId: number;
  orderDate: string;
  priority: string;
  status: string;
  className?: string;
}

export const OrderCardHeader: React.FC<OrderCardHeaderProps> = ({
  orderId,
  orderDate,
  priority,
  status,
  className = '',
}) => {
  return (
    <div className={className}>
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-2xl font-bold text-gray-900">{displayId.order(orderId)}</h2>
        <Badge variant={priority} size="sm" />
        <Badge variant={status} size="sm" />
        <span className="text-sm text-gray-600">{formatDate(orderDate)}</span>
      </div>
    </div>
  );
};

// ============================================================================
// OrderMetadata Component
// ============================================================================

interface OrderMetadataProps {
  patientName: string;
  patientId: number;
  orderDate: string;
  referringPhysician?: string;
  className?: string;
}

export const OrderMetadata: React.FC<OrderMetadataProps> = ({
  patientName,
  patientId,
  orderDate,
  referringPhysician,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Avatar primaryText={patientName} size="sm" />
      <div>
        <div className="font-medium text-gray-900">{patientName}</div>
        <div className="text-xs text-gray-500">
          {displayId.patient(patientId)} • {formatDate(orderDate)}
          {referringPhysician && ` • ${referringPhysician}`}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// BillingSummaryCard Component
// ============================================================================

interface BillingSummaryCardProps {
  totalPrice: number;
  paymentStatus: PaymentStatus;
}

export const BillingSummaryCard: React.FC<BillingSummaryCardProps> = ({
  totalPrice,
  paymentStatus,
}) => {
  return (
    <SectionContainer title="Billing Summary">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-medium">{formatCurrency(totalPrice)}</span>
        </div>
        <div className="border-t pt-2 flex justify-between">
          <span className="font-semibold text-gray-900">Total:</span>
          <span className="font-bold text-xl text-sky-600">{formatCurrency(totalPrice)}</span>
        </div>
        <div className="flex justify-between items-center pt-2">
          <span className="text-sm text-gray-600">Payment Status:</span>
          <Badge
            variant={
              paymentStatus === 'paid'
                ? 'success'
                : paymentStatus === 'unpaid'
                  ? 'warning'
                  : 'default'
            }
            size="sm"
            className="border-none font-medium"
          >
            {paymentStatus.toUpperCase()}
          </Badge>
        </div>
      </div>
    </SectionContainer>
  );
};

// ============================================================================
// TestListCard Component
// ============================================================================

interface TestListCardProps {
  tests: OrderTest[];
  title?: string;
}

export const TestListCard: React.FC<TestListCardProps> = ({ tests, title }) => {
  return (
    <SectionContainer title={title || `Tests (${tests.length})`}>
      <div className="space-y-3">
        {tests.map((test, index) => {
          return (
            <div key={index} className="border border-gray-200 rounded p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium text-gray-900">{test.testName}</div>
                  <div className="text-sm text-gray-600">
                    {test.testCode} • {test.sampleType}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-sky-600">
                    {formatCurrency(test.priceAtOrder)}
                  </div>
                  <Badge variant={test.status} size="sm" />
                </div>
              </div>

              {test.results && (
                <div className="mt-3 p-3 bg-gray-50 rounded">
                  <div className="text-sm font-medium text-gray-700 mb-2">Results:</div>
                  <div className="space-y-1">
                    {Object.entries(test.results).map(([key, result]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-600">{key}:</span>
                        <span
                          className={`font-medium ${
                            result.status === 'high' || result.status === 'low'
                              ? 'text-orange-600'
                              : result.status === 'critical'
                                ? 'text-red-600'
                                : 'text-gray-900'
                          }`}
                        >
                          {result.value} {result.unit}
                          {result.referenceRange && (
                            <span className="text-gray-500 ml-2">
                              (Ref: {result.referenceRange})
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {test.validationNotes && (
                <div className="mt-2 p-2 bg-sky-50 rounded text-sm">
                  <span className="font-medium text-sky-900">Validation Notes: </span>
                  <span className="text-sky-800">{test.validationNotes}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SectionContainer>
  );
};
