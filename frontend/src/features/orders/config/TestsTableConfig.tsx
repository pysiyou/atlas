import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components';
import type { TableViewConfig, CardComponentProps } from '@/components';
import { DATA_ID_PRIMARY_INLINE } from '@/utils/constants';
import { formatCurrency, formatDate, displayId } from '@/utils';
import { getTestName } from '@/features/catalog/utils';
import { getLabQueueUrlForTest } from '@/features/lab';
import type { OrderTest, Test } from '@/types';
import { getBadgeAppearance } from '@/components/theme/theme';
import { TAG_STYLES } from '@/components/primitives/badgeHelpers';

function createTestCodeColumn(tagStyles: { container: string }) {
  return {
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
              isSuperseded ? 'text-text-disabled line-through font-id' : DATA_ID_PRIMARY_INLINE
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
  };
}

function createTestNameColumn(testCatalog: Test[]) {
  return {
    key: 'testName',
    header: 'Name',
    width: { min: 280, grow: 2, shrink: 1 },
    render: (test: OrderTest) => {
      const name = getTestName(test.testCode, testCatalog);
      const isSuperseded = test.status === 'superseded';
      return (
        <span className={isSuperseded ? 'text-text-disabled line-through' : 'text-text-primary'}>
          {name}
        </span>
      );
    },
  };
}

function createStatusColumn() {
  return {
    key: 'status',
    header: 'Status',
    width: 'sm' as const,
    render: (test: OrderTest) => (
      <Badge variant={test.status} size="sm" strikethrough={test.status === 'superseded'} />
    ),
  };
}

function createLabLinkColumn(orderId: number) {
  return {
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
  };
}

function createDetailedExtraColumns(_testCatalog: Test[], labColumn: ReturnType<typeof createLabLinkColumn>) {
  return [
    {
      key: 'sampleId',
      header: 'Sample',
      width: 'sm' as const,
      render: (test: OrderTest) =>
        test.sampleId ? (
          <span className="entity-id">{displayId.sample(test.sampleId)}</span>
        ) : (
          <span className="text-xs text-text-tertiary">—</span>
        ),
    },
    {
      key: 'resultEnteredAt',
      header: 'Entered',
      width: 'lg' as const,
      render: (test: OrderTest) =>
        test.resultEnteredAt ? (
          <span className="text-xs text-text-secondary">{formatDate(test.resultEnteredAt)}</span>
        ) : (
          <span className="text-xs text-text-tertiary">—</span>
        ),
    },
    // {
    //   key: 'critical',
    //   header: '',
    //   width: 'sm' as const,
    //   render: (test: OrderTest) =>
    //     test.hasCriticalValues || test.flags?.some(f => f.toLowerCase().includes('critical')) ? (
    //       <Badge variant="danger" size="xs" className="flex items-center gap-1 w-fit">
    //         <Icon name={ICONS.actions.alertCircle} className="w-3 h-3" />
    //         Critical
    //       </Badge>
    //     ) : null,
    // },
    labColumn,
    // {
    //   key: 'sampleType',
    //   header: 'Type',
    //   width: 'sm' as const,
    //   render: (test: OrderTest) => {
    //     const sampleType = getTestSampleType(test.testCode, testCatalog);
    //     const isSuperseded = test.status === 'superseded';
    //     return <Badge variant={sampleType as 'default'} size="sm" strikethrough={isSuperseded} />;
    //   },
    // },
    // {
    //   key: 'priceAtOrder',
    //   header: 'Price',
    //   width: 'sm' as const,
    //   align: 'right' as const,
    //   render: (test: OrderTest) => {
    //     const isSuperseded = test.status === 'superseded';
    //     return (
    //       <span className={isSuperseded ? 'text-text-disabled line-through' : DATA_AMOUNT}>
    //         {formatCurrency(test.priceAtOrder)}
    //       </span>
    //     );
    //   },
    // },
  ];
}

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
              isSuperseded ? 'text-text-disabled line-through font-id' : DATA_ID_PRIMARY_INLINE
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
  orderId: number
): TableViewConfig<OrderTest> {
  const appearance = getBadgeAppearance();
  const tagStyles = TAG_STYLES[appearance];

  const labLinkColumn = createLabLinkColumn(orderId);
  const simpleColumns = [
    createTestCodeColumn(tagStyles),
    createTestNameColumn(testCatalog),
    createStatusColumn(),
    labLinkColumn,
  ];

  const detailedColumns = [
    ...simpleColumns.slice(0, 3),
    ...createDetailedExtraColumns(testCatalog, labLinkColumn),
  ];

  return {
    fullColumns: detailedColumns,
    mediumColumns: detailedColumns,
    compactColumns: simpleColumns,
    CardComponent: createTestTableCard(testCatalog),
  };
}
