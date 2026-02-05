/**
 * TestsTable – uses shared Table with viewConfig.
 * testCatalog required for name/category/sample lookups; variant drives simple vs detailed columns.
 */

import React, { useMemo } from 'react';
import { Table, Badge, EmptyState } from '@/shared/ui';
import type { TableViewConfig, CardComponentProps } from '@/shared/ui/Table';
import { DATA_AMOUNT, DATA_ID_PRIMARY_INLINE } from '@/shared/constants';
import { formatCurrency } from '@/utils';
import { getTestName, getTestSampleType } from '@/utils/typeHelpers';
import type { OrderTest, Test } from '@/types';
import { ICONS } from '@/utils';
import { getBadgeAppearance } from '@/shared/theme/theme';
import { TAG_STYLES } from '@/shared/ui/display/badge-colors';

export interface TestsTableProps {
  tests: OrderTest[];
  testCatalog: Test[];
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

function createTestsTableConfig(testCatalog: Test[]): TableViewConfig<OrderTest> {
  const appearance = getBadgeAppearance();
  const tagStyles = TAG_STYLES[appearance];

  const simpleColumns = [
    {
      key: 'testCode',
      header: 'Code',
      width: 'sm' as const,
      render: (test: OrderTest) => {
        const isSuperseded = test.status === 'superseded';
        const isRetest = test.isRetest || false;
        const retestNumber = test.retestNumber ?? 0;
        return (
          <div className="flex items-center gap-1">
            <span
              className={
                isSuperseded ? 'text-fg-disabled line-through font-mono' : DATA_ID_PRIMARY_INLINE
              }
            >
              {test.testCode}
            </span>
            {isRetest && retestNumber > 0 && (
              <Badge variant="info" size="xs" className={tagStyles.container}>
                #{retestNumber}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'testName',
      header: 'Name',
      width: 'fill' as const,
      render: (test: OrderTest) => {
        const name = getTestName(test.testCode, testCatalog);
        const isSuperseded = test.status === 'superseded';
        return (
          <span className={isSuperseded ? 'text-fg-disabled line-through' : 'text-fg'}>
            {name}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      width: 'sm' as const,
      render: (test: OrderTest) => (
        <Badge variant={test.status} size="sm" strikethrough={test.status === 'superseded'} />
      ),
    },
  ];

  const detailedColumns = [
    ...simpleColumns,
    // {
    //   key: 'category',
    //   header: 'Category',
    //   width: 'md' as const,
    //   render: (test: OrderTest) => {
    //     const category = getTestCategory(test.testCode, testCatalog);
    //     const isSuperseded = test.status === 'superseded';
    //     return (
    //       <Badge variant={category as 'default'} size="sm" strikethrough={isSuperseded} />
    //     );
    //   },
    // },
    {
      key: 'sampleType',
      header: 'Sample',
      width: 'sm' as const,
      render: (test: OrderTest) => {
        const sampleType = getTestSampleType(test.testCode, testCatalog);
        const isSuperseded = test.status === 'superseded';
        return (
          <Badge variant={sampleType as 'default'} size="sm" strikethrough={isSuperseded} />
        );
      },
    },
    {
      key: 'priceAtOrder',
      header: 'Price',
      width: 'sm' as const,
      align: 'right' as const,
      render: (test: OrderTest) => {
        const isSuperseded = test.status === 'superseded';
        return (
          <span
            className={
              isSuperseded ? 'text-fg-disabled line-through' : DATA_AMOUNT
            }
          >
            {formatCurrency(test.priceAtOrder)}
          </span>
        );
      },
    },
  ];

  const CardComponent: React.FC<CardComponentProps<OrderTest>> = ({ item, onClick }) => {
    const name = getTestName(item.testCode, testCatalog);
    const isSuperseded = item.status === 'superseded';
    return (
      <div
        className="p-3 border border-stroke rounded-lg hover:bg-panel-hover cursor-pointer"
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onClick?.()}
      >
        <div className="flex items-center justify-between gap-2">
          <span className={isSuperseded ? 'text-fg-disabled line-through font-mono' : DATA_ID_PRIMARY_INLINE}>
            {item.testCode}
          </span>
          <Badge variant={item.status} size="sm" strikethrough={isSuperseded} />
        </div>
        <div className={`text-sm mt-1 ${isSuperseded ? 'text-fg-disabled line-through' : 'text-fg'}`}>
          {name}
        </div>
        <div className="text-xs text-fg-subtle mt-1">{formatCurrency(item.priceAtOrder)}</div>
      </div>
    );
  };

  return {
    fullColumns: detailedColumns,
    mediumColumns: detailedColumns,
    compactColumns: simpleColumns,
    CardComponent,
  };
}

export const TestsTable: React.FC<TestsTableProps> = ({
  tests,
  testCatalog,
  variant = 'simple',
}) => {
  const visibleTests = useMemo(
    () => tests.filter(t => t.status !== 'removed'),
    [tests]
  );

  const viewConfig = useMemo(
    () => (variant === 'detailed' ? createTestsTableConfig(testCatalog) : (() => {
      const config = createTestsTableConfig(testCatalog);
      return {
        ...config,
        fullColumns: config.compactColumns,
        mediumColumns: config.compactColumns,
        compactColumns: config.compactColumns,
      };
    })()),
    [testCatalog, variant]
  );

  const rowClassName = (test: OrderTest) =>
    test.status === 'superseded' ? 'bg-canvas/50 opacity-60' : '';

  return (
    <Table<OrderTest>
      data={visibleTests}
      viewConfig={viewConfig}
      getRowKey={(t, i) => t.id ?? i}
      rowClassName={rowClassName}
      pagination={false}
      emptyMessage={EMPTY_MESSAGE}
      embedded
    />
  );
};
