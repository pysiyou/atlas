/**
 * PatientOrdersTable – related orders on patient detail (columns tuned for that panel).
 */

import React, { useMemo } from 'react';
import { DataTable, EmptyState, EMPTY_COPY, PANEL_EMPTY_STATE } from '@/components';
import type { Order } from '@/types/order';
import { useTestNameLookup } from '@/features/catalog';
import { createPatientRelatedOrdersTableConfig } from '../config/PatientOrdersTable.config';
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
    () => createPatientRelatedOrdersTableConfig(getTestName),
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
