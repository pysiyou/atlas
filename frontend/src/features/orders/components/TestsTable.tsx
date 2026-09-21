/**
 * TestsTable – uses shared Table with viewConfig.
 * testCatalog required for name/category/sample lookups; variant drives simple vs detailed columns.
 */

import React, { useMemo } from 'react';
import { Table, EmptyState, EMPTY_COPY } from '@/components';
import { useTestCatalog } from '@/features/catalog';
import type { OrderTest } from '@/types';
import { createTestsTableConfig } from '../config/TestsTable.config';

export interface TestsTableProps {
  tests: OrderTest[];
  orderId: number;
  supersededCount?: number;
  variant?: 'simple' | 'detailed';
}

const EMPTY_MESSAGE = (
  <EmptyState
    variant="compact"
    fill
    title={EMPTY_COPY.orderTests.title}
    description={EMPTY_COPY.orderTests.description}
  />
);

export const TestsTable: React.FC<TestsTableProps> = ({ tests, orderId, variant = 'simple' }) => {
  const { tests: testCatalog = [] } = useTestCatalog();
  const visibleTests = useMemo(() => tests.filter(t => t.status !== 'removed'), [tests]);

  const viewConfig = useMemo(
    () => createTestsTableConfig(testCatalog, orderId, variant),
    [testCatalog, orderId, variant]
  );

  const rowClassName = (test: OrderTest) => {
    if (test.status === 'superseded') return 'bg-surface-page/50 opacity-60';
    if (test.status === 'cancelled') return 'bg-danger/5 opacity-75';
    return '';
  };

  return (
    <Table<OrderTest>
      data={visibleTests}
      viewConfig={viewConfig}
      striped
      getRowKey={(t, i) => t.id ?? i}
      rowClassName={rowClassName}
      pagination={{ mode: 'none' }}
      emptyMessage={EMPTY_MESSAGE}
      embedded
    />
  );
};
