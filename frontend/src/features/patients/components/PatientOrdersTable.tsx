/**
 * PatientOrdersTable – reuses order list table config for identical columns/card.
 */

import React, { useMemo } from 'react';
import { Table, EmptyState } from '@/components';
import type { Order } from '@/types/order';
import { useTestNameLookup } from '@/features/catalog/api/tests.api';
import { usePatientNameLookup } from '@/features/patients/api/patients.api';
import { createOrderTableConfig } from '@/features/orders/config/OrderTable.config';
import { ICONS } from '@/config/icons';

export interface PatientOrdersTableProps {
  orders: Order[];
  onOrderClick: (orderId: string) => void;
}

const EMPTY_MESSAGE = (
  <EmptyState
    icon={ICONS.dataFields.document}
    title="No Orders Found"
    description="This patient has no orders yet."
  />
);

export const PatientOrdersTable: React.FC<PatientOrdersTableProps> = ({ orders, onOrderClick }) => {
  const { getPatientName } = usePatientNameLookup();
  const { getTestName } = useTestNameLookup();

  const viewConfig = useMemo(
    () => createOrderTableConfig(() => {}, getPatientName, getTestName),
    [getPatientName, getTestName]
  );

  return (
    <Table<Order>
      data={orders}
      viewConfig={viewConfig}
      striped
      onRowClick={order => onOrderClick(String(order.orderId))}
      getRowKey={order => order.orderId}
      pagination={false}
      emptyMessage={EMPTY_MESSAGE}
      embedded
    />
  );
};
