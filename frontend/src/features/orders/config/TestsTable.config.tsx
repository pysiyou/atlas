import React from 'react';
import { Link } from 'react-router-dom';
import { Badge, EntityId } from '@/components';
import type { TableViewConfig, CardComponentProps } from '@/components';
import { buildViews } from '@/components/data-table';
import { cn, formatCurrency, formatDateTime } from '@/utils';
import { getTestName, getTestProperty } from '@/features/catalog/testLookup';
import { getLabQueueUrlForTest } from '@/features/lab';
import { getOrderTestLineageRowClass } from '../utils/orderTestLineage';
import type { OrderTest, Test } from '@/types';
import { TYPE, RADIUS } from '@/components/theme/recipes';


const SIMPLE_VIEWS = {
  full: ['test', 'category', 'status', 'lab'],
  medium: ['test', 'category', 'status', 'lab'],
  compact: ['test', 'category', 'status', 'lab'],
} as const;

const DETAILED_VIEWS = {
  full: ['test', 'category', 'status', 'sampleId', 'updatedAt', 'lab'],
  medium: ['test', 'category', 'status', 'sampleId', 'updatedAt', 'lab'],
  compact: SIMPLE_VIEWS.compact,
} as const;

/** Test code under the display name — smaller than the name, secondary tone. */
const TEST_CODE_TEXT = 'text-xxs text-text-secondary';

function renderOrderTestIdentity(test: OrderTest, testCatalog: Test[]) {
  const name = getTestName(test.testCode, testCatalog);

  return (
    <div className="min-w-0 flex flex-col gap-space-0-5">
      <span className={cn(TYPE.value, 'block min-w-0 truncate')} title={name}>
        {name}
      </span>
      <EntityId variant="secondary" className={cn(TEST_CODE_TEXT, 'truncate')}>
        {test.testCode}
      </EntityId>
    </div>
  );
}

function renderTestCategoryBadge(test: OrderTest, testCatalog: Test[]) {
  const category = getTestProperty(test.testCode, 'category', testCatalog);
  if (!category) return null;
  return <Badge variant={category} size="xs" className="border-none" />;
}

function createTestTableCard(testCatalog: Test[]): React.FC<CardComponentProps<OrderTest>> {
  return function TestTableCard({ item, onClick }) {
    const categoryBadge = renderTestCategoryBadge(item, testCatalog);

    const lineageRowClass = getOrderTestLineageRowClass(item);

    return (
      <div
        className={cn(
          `p-space-3 border border-border-default ${RADIUS.overlay} hover:bg-surface-hover cursor-pointer`,
          lineageRowClass
        )}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onClick?.()}
      >
        <div className="flex items-start justify-between gap-space-2">
          <div className="min-w-0 flex-1">{renderOrderTestIdentity(item, testCatalog)}</div>
          <Badge variant={item.status} size="xs" className="shrink-0" />
        </div>
        {categoryBadge ? <div className="mt-space-2">{categoryBadge}</div> : null}
        <div className={`${TYPE.meta} mt-space-1`}>{formatCurrency(item.priceAtOrder)}</div>
      </div>
    );
  };
}

export function createTestsTableConfig(
  testCatalog: Test[],
  orderId: number,
  variant: 'simple' | 'detailed' = 'detailed'
): TableViewConfig<OrderTest> {
  const columnMap = {
    test: {
      key: 'test',
      header: 'Test',
      width: { min: 280, grow: 2, shrink: 1 },
      truncate: true,
      accessor: (test: OrderTest) =>
        `${getTestName(test.testCode, testCatalog)} ${test.testCode}`,
      render: (test: OrderTest) => renderOrderTestIdentity(test, testCatalog),
    },
    category: {
      key: 'category',
      header: 'Category',
      width: 'lg' as const,
      accessor: (test: OrderTest) => getTestProperty(test.testCode, 'category', testCatalog) ?? '',
      render: (test: OrderTest) => renderTestCategoryBadge(test, testCatalog) ?? <span className={TYPE.meta}>—</span>,
    },
    status: {
      key: 'status',
      header: 'Status',
      width: 'sm' as const,
      accessor: (test: OrderTest) => test.status,
      render: (test: OrderTest) => (
        <Badge variant={test.status} size="xs" />
      ),
    },
    sampleId: {
      key: 'sampleId',
      header: 'Sample',
      width: 'id' as const,
      accessor: (test: OrderTest) => test.sampleId ?? '',
      render: (test: OrderTest) =>
        test.sampleId ? (
          <EntityId type="sample" value={test.sampleId} />
        ) : (
          <span className={TYPE.meta}>—</span>
        ),
    },
    updatedAt: {
      key: 'updatedAt',
      header: 'Updated',
      width: 'lg' as const,
      accessor: (test: OrderTest) => test.updatedAt ?? '',
      render: (test: OrderTest) =>
        test.updatedAt ? (
          <span className={TYPE.label}>{formatDateTime(test.updatedAt)}</span>
        ) : (
          <span className={TYPE.meta}>—</span>
        ),
    },
    lab: {
      key: 'lab',
      header: '',
      width: { min: 100, base: 108, grow: 0, shrink: 0 },
      render: (test: OrderTest) => {
        const labUrl = getLabQueueUrlForTest(test, orderId);
        if (!labUrl) return null;
        return (
          <Link
            to={labUrl}
            className="text-xs text-brand hover:underline whitespace-nowrap"
            onClick={e => e.stopPropagation()}
          >
            View in Lab
          </Link>
        );
      },
    },
  };

  const views = variant === 'simple' ? SIMPLE_VIEWS : DETAILED_VIEWS;

  return {
    ...buildViews(columnMap, views),
    CardComponent: createTestTableCard(testCatalog),
  };
}
