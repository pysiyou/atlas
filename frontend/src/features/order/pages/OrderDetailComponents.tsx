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
import { displayId } from '@/utils';
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
        <h2 className="text-2xl font-bold text-brand font-mono">{displayId.order(orderId)}</h2>
        <Badge variant={priority} size="sm" />
        <Badge variant={status} size="sm" />
        <span className="text-sm text-text-tertiary">{formatDate(orderDate)}</span>
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
        <div className="font-medium text-text-primary">{patientName}</div>
        <div className="text-xs text-text-tertiary">
          <span className="font-mono text-brand">{displayId.patient(patientId)}</span> • {formatDate(orderDate)}
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
          <span className="text-text-tertiary">Subtotal:</span>
          <span className="font-medium">{formatCurrency(totalPrice)}</span>
        </div>
        <div className="border-t pt-2 flex justify-between">
          <span className="font-semibold text-text-primary">Total:</span>
          <span className="font-bold text-xl text-brand">{formatCurrency(totalPrice)}</span>
        </div>
        <div className="flex justify-between items-center pt-2">
          <span className="text-sm text-text-tertiary">Payment Status:</span>
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
            <div key={index} className="border border-border rounded p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium text-text-primary">{test.testName}</div>
                  <div className="text-sm text-text-tertiary">
                    <span className="text-brand font-mono">{test.testCode}</span> • {test.sampleType}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-brand">
                    {formatCurrency(test.priceAtOrder)}
                  </div>
                  <Badge variant={test.status} size="sm" />
                </div>
              </div>

              {test.results && (
                <div className="mt-3 p-3 bg-app-bg rounded">
                  <div className="text-sm font-medium text-text-secondary mb-2">Results:</div>
                  <div className="space-y-1">
                    {Object.entries(test.results).map(([key, result]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-text-tertiary">{key}:</span>
                        <span
                          className={`font-medium ${
                            result.status === 'high' || result.status === 'low'
                              ? 'text-warning'
                              : result.status === 'critical'
                                ? 'text-danger'
                                : 'text-text-primary'
                          }`}
                        >
                          {result.value} {result.unit}
                          {result.referenceRange && (
                            <span className="text-text-tertiary ml-2">
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
                <div className="mt-2 p-2 bg-brand/10 rounded text-sm">
                  <span className="font-medium text-brand">Validation Notes: </span>
                  <span className="text-brand">{test.validationNotes}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SectionContainer>
  );
};
