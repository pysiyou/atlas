import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components';
import type { TableViewConfig, CardComponentProps } from '@/components';
import { buildViews } from '@/components/data-table';
import { ENTITY_ID_INLINE } from '@/utils/constants';
import { formatCurrency, formatDateTime, displayId } from '@/utils';
import { getTestName } from '@/features/catalog/utils';
import { getLabQueueUrlForTest } from '@/features/lab';
import type { OrderTest, Test } from '@/types';

const SIMPLE_VIEWS = {
  full: ['testCode', 'testName', 'status', 'lab'],
  medium: ['testCode', 'testName', 'status', 'lab'],
  compact: ['testCode', 'testName', 'status', 'lab'],
} as const;

const DETAILED_VIEWS = {
  full: ['testCode', 'testName', 'status', 'sampleId', 'resultEnteredAt', 'lab'],
  medium: ['testCode', 'testName', 'status', 'sampleId', 'resultEnteredAt', 'lab'],
  compact: SIMPLE_VIEWS.compact,
} as const;

function createTestTableCard(testCatalog: Test[]): React.FC<CardComponentProps<OrderTest>> {
  return function TestTableCard({ item, onClick }) {
    const name = getTestName(item.testCode, testCatalog);
    const isSuperseded = item.status === 'superseded';
    return (
      <div
        className="p-3 border border-border-default rounded-lg hover:bg-surface-hover cursor-pointer"
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onClick?.()}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className={
              isSuperseded ? 'text-text-disabled line-through font-id' : ENTITY_ID_INLINE
            }
          >
            {item.testCode}
          </span>
          <Badge variant={item.status} size="sm" strikethrough={isSuperseded} />
        </div>
        <div
          className={`text-sm mt-1 ${isSuperseded ? 'text-text-disabled line-through' : 'text-text-primary'}`}
        >
          {name}
        </div>
        <div className="text-xs text-text-tertiary mt-1">{formatCurrency(item.priceAtOrder)}</div>
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
    testCode: {
      key: 'testCode',
      header: 'Code',
      width: 'id' as const,
      accessor: (test: OrderTest) => test.testCode,
      render: (test: OrderTest) => {
        const isSuperseded = test.status === 'superseded';
        const isRetest = test.isRetest || false;
        const retestNumber = test.retestNumber ?? 0;
        return (
          <div className="flex items-center gap-1">
            <span
              className={
                isSuperseded ? 'text-text-disabled line-through font-id' : ENTITY_ID_INLINE
              }
            >
              {test.testCode}
            </span>
            {isRetest && retestNumber > 0 && (
              <Badge variant="info" size="xs" uppercase={false}>
                #{retestNumber}
              </Badge>
            )}
          </div>
        );
      },
    },
    testName: {
      key: 'testName',
      header: 'Name',
      width: { min: 280, grow: 2, shrink: 1 },
      accessor: (test: OrderTest) => getTestName(test.testCode, testCatalog),
      render: (test: OrderTest) => {
        const name = getTestName(test.testCode, testCatalog);
        const isSuperseded = test.status === 'superseded';
        return (
          <span className={isSuperseded ? 'text-text-disabled line-through' : 'text-text-primary'}>
            {name}
          </span>
        );
      },
    },
    status: {
      key: 'status',
      header: 'Status',
      width: 'sm' as const,
      accessor: (test: OrderTest) => test.status,
      render: (test: OrderTest) => (
        <Badge variant={test.status} size="sm" strikethrough={test.status === 'superseded'} />
      ),
    },
    sampleId: {
      key: 'sampleId',
      header: 'Sample',
      width: 'id' as const,
      accessor: (test: OrderTest) => test.sampleId ?? '',
      render: (test: OrderTest) =>
        test.sampleId ? (
          <span className="entity-id">{displayId.sample(test.sampleId)}</span>
        ) : (
          <span className="text-xs text-text-tertiary">—</span>
        ),
    },
    resultEnteredAt: {
      key: 'resultEnteredAt',
      header: 'Entered',
      width: 'lg' as const,
      accessor: (test: OrderTest) => test.resultEnteredAt ?? '',
      render: (test: OrderTest) =>
        test.resultEnteredAt ? (
          <span className="text-xs text-text-secondary">{formatDateTime(test.resultEnteredAt)}</span>
        ) : (
          <span className="text-xs text-text-tertiary">—</span>
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
