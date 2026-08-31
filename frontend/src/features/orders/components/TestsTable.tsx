/**
 * TestsTable – uses shared Table with viewConfig.
 * testCatalog required for name/category/sample lookups; variant drives simple vs detailed columns.
 */

import React, { useMemo } from 'react';
import { Table, EmptyState } from '@/components';
import { useTestCatalog } from '@/features/catalog';
import type { OrderTest } from '@/types';
import { ICONS } from '@/config/icons';
import { createTestsTableConfig } from '../config/TestsTableConfig';

export interface TestsTableProps {
  tests: OrderTest[];
  orderId: number;
  supersededCount?: number;
  variant?: 'simple' | 'detailed';
}

const EMPTY_MESSAGE = (
  <EmptyState
    icon={ICONS.dataFields.health}
    title="No Tests"
    description="This order has no tests."
  />
);

export const TestsTable: React.FC<TestsTableProps> = ({ tests, orderId, variant = 'simple' }) => {
  const { tests: testCatalog = [] } = useTestCatalog();
  const visibleTests = useMemo(() => tests.filter(t => t.status !== 'removed'), [tests]);

  const viewConfig = useMemo(
    () =>
      variant === 'detailed'
        ? createTestsTableConfig(testCatalog, orderId)
        : (() => {
            const config = createTestsTableConfig(testCatalog, orderId);
            return {
              ...config,
              fullColumns: config.compactColumns,
              mediumColumns: config.compactColumns,
              compactColumns: config.compactColumns,
            };
          })(),
    [testCatalog, orderId, variant]
  );

  const rowClassName = (test: OrderTest) =>
    test.status === 'superseded' ? 'bg-surface-page/50 opacity-60' : '';

  return (
    <Table<OrderTest>
      data={visibleTests}
      viewConfig={viewConfig}
      striped
      getRowKey={(t, i) => t.id ?? i}
      rowClassName={rowClassName}
      pagination={false}
      emptyMessage={EMPTY_MESSAGE}
      embedded
    />
  );
};
