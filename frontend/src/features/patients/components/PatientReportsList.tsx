/**
 * PatientReportsList Component
 * Displays a list of available patient reports
 */

import React from 'react';
import { Icon, IconButton, EmptyState, EntityId, EMPTY_COPY, PANEL_EMPTY_STATE } from '@/components';
import { formatDateTime } from '@/utils';
import type { Order } from '@/types';
import { getReportableOrders } from '../utils/patientFormatters';
import { ICONS } from '@/config/icons';
import { TONE, TYPE } from '@/components/theme/recipes';


export interface PatientReportsListProps {
  orders: Order[];
}

export const PatientReportsList: React.FC<PatientReportsListProps> = ({ orders }) => {
  const reportableOrders = getReportableOrders(orders);

  if (reportableOrders.length === 0) {
    return (
      <EmptyState
        {...PANEL_EMPTY_STATE}
        title={EMPTY_COPY.reports.title}
        description={EMPTY_COPY.reports.description}
      />
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border-subtle">
      {reportableOrders.map((order: Order) => (
        <div
          key={order.orderId}
          className="flex items-center justify-between p-space-3 hover:bg-surface-page group"
        >
          <div className="flex items-center gap-space-3 overflow-hidden">
            <div className="w-8 h-8 flex items-center justify-center">
              <Icon name={ICONS.dataFields.pdf} className={`w-full h-full ${TONE.danger.fg}`} />
            </div>
            <div className="min-w-0">
              <p className={`${TYPE.value} font-normal truncate`}>
                Report_<EntityId type="order" value={order.orderId} />.pdf
              </p>
              <p className={`${TYPE.meta} mt-space-0-5`}>
                {formatDateTime(order.orderDate)} • 1.2 MB
              </p>
            </div>
          </div>
          <IconButton variant="download" size="sm" title="Download Report" />
        </div>
      ))}
    </div>
  );
};
