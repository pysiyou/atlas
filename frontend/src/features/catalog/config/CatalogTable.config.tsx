/**
 * Catalog Table Configuration
 */

import type { NavigateFunction } from 'react-router-dom';
import { RecordId } from '@/features/shared';
import { CatalogCategoryBadge, CatalogSampleTypeBadge } from '../components/CatalogStatusBadge';
import type { TableViewConfig } from '@/components/data-table';
import { buildViews, TABLE_COLUMN_WIDTH } from '@/components/data-table';
import { formatCurrency } from '@/utils';
import type { TestSummary } from '@/types';
import { CatalogCard } from '../components/CatalogCard';
import {BADGE, TABLE_TYPE, FG } from '@/theme/recipes';


const CATALOG_VIEWS = {
  full: ['code', 'name', 'category', 'sampleType', 'loincCodes', 'price'],
  medium: ['code', 'name', 'category', 'sampleType', 'price'],
  compact: ['code', 'name', 'price'],
} as const;

export const createCatalogTableConfig = (_navigate: NavigateFunction): TableViewConfig<TestSummary> => {
  const columnMap = {
    code: {
      key: 'code',
      header: 'Code',
      width: TABLE_COLUMN_WIDTH.code,
      sortable: true,
      accessor: (test: TestSummary) => test.code,
      render: (test: TestSummary) => (
        <RecordId emphasis="block">{test.code}</RecordId>
      ),
    },
    name: {
      key: 'name',
      header: 'Test',
      width: TABLE_COLUMN_WIDTH.flex,
      sortable: true,
      truncate: true,
      accessor: (test: TestSummary) => test.name,
      render: (test: TestSummary) => (
        <div className="min-w-0 font-normal">
          <div className={`${TABLE_TYPE.cell} truncate font-normal`}>{test.name}</div>
          {test.synonyms && test.synonyms.length > 0 && (
            <div className={`${TABLE_TYPE.meta} truncate font-normal`}>
              {test.synonyms.slice(0, 2).join(', ')}
              {test.synonyms.length > 2 && ` +${test.synonyms.length - 2} more`}
            </div>
          )}
        </div>
      ),
    },
    loincCodes: {
      key: 'loincCodes',
      header: 'LOINC',
      width: TABLE_COLUMN_WIDTH.code,
      accessor: (test: TestSummary) => test.loincCodes?.join(', ') ?? '',
      render: (test: TestSummary) => {
        if (!test.loincCodes || test.loincCodes.length === 0) {
          return <div className={`${TABLE_TYPE.meta} ${FG.disabled} truncate font-normal`}>-</div>;
        }
        return (
          <div className={`${TABLE_TYPE.cell} truncate font-normal`}>
            {test.loincCodes.join(', ')}
          </div>
        );
      },
    },
    category: {
      key: 'category',
      header: 'Category',
      width: TABLE_COLUMN_WIDTH.category,
      sortable: true,
      accessor: (test: TestSummary) => test.category,
      render: (test: TestSummary) => (
        <CatalogCategoryBadge category={test.category} size="xs" className={BADGE.tableEmbed} />
      ),
    },
    sampleType: {
      key: 'sampleType',
      header: 'Sample Type',
      width: TABLE_COLUMN_WIDTH.badge,
      sortable: true,
      accessor: (test: TestSummary) => test.sampleType,
      render: (test: TestSummary) => <CatalogSampleTypeBadge sampleType={test.sampleType} size="xs" />,
    },
    price: {
      key: 'price',
      header: 'Price',
      width: TABLE_COLUMN_WIDTH.amount,
      sortable: true,
      accessor: (test: TestSummary) => test.price,
      render: (test: TestSummary) => (
        <div className={`${TABLE_TYPE.amount} truncate font-normal`}>{formatCurrency(test.price)}</div>
      ),
    },
  };

  return {
    ...buildViews(columnMap, CATALOG_VIEWS, {
      medium: { sampleType: 'sm' },
    }),
    CardComponent: CatalogCard,
  };
};
