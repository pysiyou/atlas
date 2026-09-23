/**
 * PatientOrdersTable – reuses order list table config for identical columns/card.
 */

import React, { useMemo } from 'react';
import { DataTable, EmptyState, EMPTY_COPY, PANEL_EMPTY_STATE } from '@/components';
import type { Order } from '@/types/order';
import { useTestNameLookup } from '@/features/catalog';
import { createOrderTableConfig } from '@/features/orders/config/OrderTable.config';
export interface PatientOrdersTableProps {
  orders: Order[];
  onOrderClick: (orderId: string) => void;
}

const EMPTY_MESSAGE = (
  <EmptyState
    {...PANEL_EMPTY_STATE}
    title={EMPTY_COPY.relatedOrders.title}
    description={EMPTY_COPY.relatedOrders.description}
  />
);

export const PatientOrdersTable: React.FC<PatientOrdersTableProps> = ({ orders, onOrderClick }) => {
  const { getTestName } = useTestNameLookup();

  const viewConfig = useMemo(
    () => createOrderTableConfig(() => {}, () => '', getTestName, { hidePatientName: true }),
    [getTestName]
  );

  return (
    <DataTable<Order>
      data={orders}
      viewConfig={viewConfig}
      striped
      onRowClick={order => onOrderClick(String(order.orderId))}
      getRowKey={order => order.orderId}
      pagination={{ mode: 'none' }}
      emptyMessage={EMPTY_MESSAGE}
      embedded
    />
  );
};
