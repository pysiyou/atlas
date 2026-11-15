/**
 * PatientOrdersTable – related orders on patient detail (columns tuned for that panel).
 */

import { useMemo } from 'react';
import { getEmptyCopy } from '@/copy';
import { EmptyState } from '@/components/display/EmptyState';
import { PANEL_EMPTY_STATE } from '@/copy';
import { DataTable } from '@/components/data-table';
import type { Order } from '@/types';
import { useTestNameLookup } from '@/features/catalog';
import { createPatientRelatedOrdersTableConfig } from '../config/PatientOrdersTable.config';
export interface PatientOrdersTableProps {
  orders: Order[];
  onOrderClick: (orderId: string) => void;
  loading?: boolean;
}

const EMPTY_MESSAGE = (
  <EmptyState
    {...PANEL_EMPTY_STATE}
    title={getEmptyCopy().relatedOrders.title}
    description={getEmptyCopy().relatedOrders.description}
  />
);

export function PatientOrdersTable({
  orders,
  onOrderClick,
  loading = false,
}: PatientOrdersTableProps) {
  const { getTestName } = useTestNameLookup();

  const viewConfig = useMemo(
    () => createPatientRelatedOrdersTableConfig(getTestName),
    [getTestName]
  );

  return (
    <DataTable<Order>
      data={orders}
      viewConfig={viewConfig}
      loading={loading}
      striped
      onRowClick={order => onOrderClick(String(order.orderId))}
      getRowKey={order => order.orderId}
      pagination={{ mode: 'none' }}
      emptyMessage={EMPTY_MESSAGE}
      embedded
    />
  );
}
