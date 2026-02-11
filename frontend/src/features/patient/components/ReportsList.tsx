/**
 * ReportsList Component
 * Displays a list of available patient reports
 */

import React from 'react';
import { Icon, IconButton, EmptyState } from '@/shared/ui';
import { displayId } from '@/utils';
import type { Order } from '@/types';
import { formatDetailDate, getReportableOrders } from '../utils/patient-formatters';
import { ICONS } from '@/utils';

export interface ReportsListProps {
  orders: Order[];
}

export const ReportsList: React.FC<ReportsListProps> = ({ orders }) => {
  const reportableOrders = getReportableOrders(orders);

  if (reportableOrders.length === 0) {
    return (
      <EmptyState
        icon={ICONS.dataFields.documentMedicine}
        title="No Reports Available"
        description="There are no validated reports for this patient yet."
      />
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border-subtle">
      {reportableOrders.map((order: Order) => (
        <div
          key={order.orderId}
          className="flex items-center justify-between p-3 hover:bg-surface-page group"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 flex items-center justify-center">
              <Icon name={ICONS.dataFields.pdf} className="w-full h-full text-danger-fg" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-normal font-mono text-text-primary truncate">
                Report_{displayId.order(order.orderId)}.pdf
              </p>
              <p className="text-xs text-text-tertiary mt-0.5">
                {formatDetailDate(order.orderDate)} • 1.2 MB
              </p>
            </div>
          </div>
          <IconButton variant="download" size="sm" title="Download Report" />
        </div>
      ))}
    </div>
  );
};
