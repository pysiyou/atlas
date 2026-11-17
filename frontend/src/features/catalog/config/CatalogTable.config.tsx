/**
 * Catalog Table Configuration
 */

import type { NavigateFunction } from 'react-router-dom';
import { RecordId } from '@/features/shared';
import { StatusValueBadge } from '@/features/shared';
import type { TableViewConfig } from '@/components/data-table';
import { buildViews, TABLE_COLUMN_WIDTH } from '@/components/data-table';
import { formatCurrency } from '@/utils';
import type { OrderableTestSummary } from '@/types';
import { CatalogCard } from '../components/CatalogCard';
import { formatSynonymsPreview } from '@/utils/presentation';
import { BADGE, TABLE_TYPE, FG } from '@/theme/recipes';


const CATALOG_VIEWS = {
  full: ['code', 'name', 'category', 'sampleType', 'loincCode', 'price'],
  medium: ['code', 'name', 'category', 'sampleType', 'price'],
  compact: ['code', 'name', 'price'],
} as const;

export const createCatalogTableConfig = (_navigate: NavigateFunction): TableViewConfig<OrderableTestSummary> => {
  const columnMap = {
    code: {
      key: 'code',
      header: 'Code',
      width: TABLE_COLUMN_WIDTH.code,
      sortable: true,
      accessor: (test: OrderableTestSummary) => test.code,
      render: (test: OrderableTestSummary) => (
        <RecordId emphasis="block">{test.code}</RecordId>
      ),
    },
    name: {
      key: 'name',
      header: 'Test',
      width: TABLE_COLUMN_WIDTH.flex,
      sortable: true,
      truncate: true,
      accessor: (test: OrderableTestSummary) => test.name,
      render: (test: OrderableTestSummary) => (
        <div className="min-w-0 font-normal">
          <div className={`${TABLE_TYPE.cell} truncate font-normal`}>{test.name}</div>
          {formatSynonymsPreview(test.synonyms) ? (
            <div className={`${TABLE_TYPE.meta} truncate font-normal`}>
              {formatSynonymsPreview(test.synonyms)}
            </div>
          ) : null}
        </div>
      ),
    },
    loincCode: {
      key: 'loincCode',
      header: 'LOINC',
      width: TABLE_COLUMN_WIDTH.code,
      accessor: (test: OrderableTestSummary) => test.loincCode?.trim() ?? '',
      render: (test: OrderableTestSummary) => {
        const loinc = test.loincCode?.trim();
        if (!loinc) {
          return <div className={`${TABLE_TYPE.meta} ${FG.disabled} truncate font-normal`}>-</div>;
        }
        return (
          <div className={`${TABLE_TYPE.cell} truncate font-normal`}>
            {loinc}
          </div>
        );
      },
    },
    category: {
      key: 'category',
      header: 'Category',
      width: TABLE_COLUMN_WIDTH.category,
      sortable: true,
      accessor: (test: OrderableTestSummary) => test.category,
      render: (test: OrderableTestSummary) => (
        <StatusValueBadge value={test.category} size="xs" className={BADGE.tableEmbed} />
      ),
    },
    sampleType: {
      key: 'sampleType',
      header: 'Sample Type',
      width: TABLE_COLUMN_WIDTH.badge,
      sortable: true,
      accessor: (test: OrderableTestSummary) => test.sampleType,
      render: (test: OrderableTestSummary) => <StatusValueBadge value={test.sampleType} size="xs" />,
    },
    price: {
      key: 'price',
      header: 'Price',
      width: TABLE_COLUMN_WIDTH.amount,
      sortable: true,
      accessor: (test: OrderableTestSummary) => test.price,
      render: (test: OrderableTestSummary) => (
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
