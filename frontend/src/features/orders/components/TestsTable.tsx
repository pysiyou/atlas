/**
 * TestsTable – uses shared DataTable with viewConfig.
 * testCatalog required for name/category/sample lookups; variant drives simple vs detailed columns.
 */

import React, { useCallback, useMemo } from 'react';
import { DataTable, EmptyState, EMPTY_COPY, PANEL_EMPTY_STATE } from '@/components';
import { useTestCatalog } from '@/features/catalog';
import { ModalType, useModal } from '@/lib/context/ModalContext';
import type { Order, OrderTest, Patient } from '@/types';
import { createTestsTableConfig } from '../config/TestsTable.config';
import { getOrderTestLineageRowClass } from '../utils/orderTestLineage';

export interface TestsTableProps {
  tests: OrderTest[];
  order: Order;
  patient?: Patient | null;
  variant?: 'simple' | 'detailed';
}

const EMPTY_MESSAGE = (
  <EmptyState
    {...PANEL_EMPTY_STATE}
    title={EMPTY_COPY.orderTests.title}
    description={EMPTY_COPY.orderTests.description}
  />
);

export const TestsTable: React.FC<TestsTableProps> = ({
  tests,
  order,
  patient = null,
  variant = 'simple',
}) => {
  const { openModal } = useModal();
  const { tests: testCatalog = [] } = useTestCatalog();
  const visibleTests = useMemo(() => tests.filter(t => t.status !== 'removed'), [tests]);

  const viewConfig = useMemo(
    () => createTestsTableConfig(testCatalog, variant),
    [testCatalog, variant]
  );

  const handleRowClick = useCallback(
    (orderTest: OrderTest) => {
      openModal(ModalType.ORDER_TEST_DETAIL, { order, orderTest, patient });
    },
    [openModal, order, patient]
  );

  return (
    <DataTable<OrderTest>
      data={visibleTests}
      viewConfig={viewConfig}
      striped
      getRowKey={(t, i) => t.id ?? i}
      rowClassName={test => getOrderTestLineageRowClass(test)}
      onRowClick={handleRowClick}
      pagination={{ mode: 'none' }}
      emptyMessage={EMPTY_MESSAGE}
      embedded
    />
  );
};
