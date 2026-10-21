import React from 'react';
import { RecordId } from '@/features/shared';
import type { TableViewConfig, CardComponentProps } from '@/components/data-table';
import {
  buildViews,
  createBadgeColumn,
  createDateTimeColumn,
  createIdColumn,
  TABLE_COLUMN_WIDTH,
} from '@/components/data-table';
import { cn, formatCurrency } from '@/utils';
import { getTestName, getTestProperty } from '@/features/catalog/testLookup';
import { StatusValueBadge } from '@/features/shared';
import { OrderTestStatusBadge } from '../components/OrderDomainBadges';
import { getOrderTestLineageRowClass } from '../utils/orderTestLineage';
import type { OrderTest, TestSummary } from '@/types';
import { text, BADGE, TABLE_TYPE, RADIUS, PRESENTATION_STACK_CLASS } from '@/theme/recipes';


const SIMPLE_VIEWS = {
  full: ['test', 'category', 'status'],
  medium: ['test', 'category', 'status'],
  compact: ['test', 'category', 'status'],
} as const;

const DETAILED_VIEWS = {
  full: ['test', 'category', 'status', 'sampleId', 'updatedAt'],
  medium: ['test', 'category', 'status', 'sampleId', 'updatedAt'],
  compact: SIMPLE_VIEWS.compact,
} as const;

function renderOrderTestIdentity(test: OrderTest, testCatalog: TestSummary[]) {
  const name = getTestName(test.testCode, testCatalog);

  return (
    <div className={PRESENTATION_STACK_CLASS}>
      <span className={cn(TABLE_TYPE.cell, 'block min-w-0 truncate')} title={name}>
        {name}
      </span>
      <RecordId emphasis="mutedBlock">{test.testCode}</RecordId>
    </div>
  );
}

function renderTestCategoryBadge(test: OrderTest, testCatalog: TestSummary[]) {
  const category = getTestProperty(test.testCode, 'category', testCatalog);
  if (!category) return null;
  return <StatusValueBadge value={category} size="xs" className={BADGE.tableEmbed} />;
}

function createTestTableCard(testCatalog: TestSummary[]): React.FC<CardComponentProps<OrderTest>> {
  return function TestTableCard({ item, onClick }) {
    const categoryBadge = renderTestCategoryBadge(item, testCatalog);

    const lineageRowClass = getOrderTestLineageRowClass(item);

    return (
      <div
        className={cn(
          `p-space-3 border border-border-default ${RADIUS.menu} hover:bg-surface-hover cursor-pointer`,
          lineageRowClass
        )}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onClick?.()}
      >
        <div className="flex items-start justify-between gap-space-2">
          <div className="min-w-0 flex-1">{renderOrderTestIdentity(item, testCatalog)}</div>
          <OrderTestStatusBadge
            status={item.status}
            presentation={item.lab?.statusPresentation}
            layout="compact"
            size="xs"
            className="shrink-0"
          />
        </div>
        {categoryBadge ? <div className="mt-space-2">{categoryBadge}</div> : null}
        <div className={`${text({ role: 'body', intent: 'muted' })} mt-space-1`}>{formatCurrency(item.priceAtOrder)}</div>
      </div>
    );
  };
}

export function createTestsTableConfig(
  testCatalog: TestSummary[],
  variant: 'simple' | 'detailed' = 'detailed'
): TableViewConfig<OrderTest> {
  const columnMap = {
    test: {
      key: 'test',
      header: 'Test',
      width: TABLE_COLUMN_WIDTH.primary,
      truncate: true,
      accessor: (test: OrderTest) =>
        `${getTestName(test.testCode, testCatalog)} ${test.testCode}`,
      render: (test: OrderTest) => renderOrderTestIdentity(test, testCatalog),
    },
    category: createBadgeColumn<OrderTest>(
      'category',
      'Category',
      test => renderTestCategoryBadge(test, testCatalog) ?? <span className={TABLE_TYPE.meta}>—</span>,
      {
        width: TABLE_COLUMN_WIDTH.category,
        accessor: test => getTestProperty(test.testCode, 'category', testCatalog) ?? '',
      }
    ),
    status: createBadgeColumn<OrderTest>(
      'status',
      'Status',
      test => (
        <OrderTestStatusBadge
          status={test.status}
          presentation={test.lab?.statusPresentation}
          layout="compact"
          size="xs"
        />
      ),
      {
        width: TABLE_COLUMN_WIDTH.badgeWide,
        accessor: test => test.status,
      }
    ),
    sampleId: createIdColumn<OrderTest>(
      'sampleId',
      'Sample',
      test =>
        test.sampleId ? (
          <RecordId type="sample" value={test.sampleId} />
        ) : (
          <span className={TABLE_TYPE.meta}>—</span>
        ),
      { accessor: test => test.sampleId ?? '' }
    ),
    updatedAt: createDateTimeColumn<OrderTest>(
      'updatedAt',
      'Date',
      test => test.updatedAt
    ),
  };

  const views = variant === 'simple' ? SIMPLE_VIEWS : DETAILED_VIEWS;

  return {
    ...buildViews(columnMap, views),
    CardComponent: createTestTableCard(testCatalog),
  };
}
