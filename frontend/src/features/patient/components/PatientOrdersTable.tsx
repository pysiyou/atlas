/**
 * PatientOrdersTable – reuses order list table config for identical columns/card.
 */

import React, { useMemo } from 'react';
import { Table, EmptyState } from '@/shared/ui';
import type { Order } from '@/types/order';
import { usePatientNameLookup, useTestNameLookup } from '@/hooks/queries';
import { createOrderTableConfig } from '@/features/order/pages/OrderTableConfig';
import { ICONS } from '@/utils';

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

export const PatientOrdersTable: React.FC<PatientOrdersTableProps> = ({
  orders,
  onOrderClick,
}) => {
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
      onRowClick={(order) => onOrderClick(String(order.orderId))}
      getRowKey={(order) => order.orderId}
      pagination={false}
      emptyMessage={EMPTY_MESSAGE}
      embedded
    />
  );
};
