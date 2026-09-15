/**
 * Catalog Table Configuration
 */

import type { NavigateFunction } from 'react-router-dom';
import { Badge, EntityId } from '@/components';
import type { TableViewConfig } from '@/components';
import { buildViews } from '@/components/data-table';
import { formatCurrency } from '@/utils';
import type { Test } from '@/types';
import { DATA_AMOUNT } from '@/utils/constants';
import { CatalogCard } from '../components/CatalogCard';

const CATALOG_VIEWS = {
  full: ['code', 'name', 'loincCodes', 'category', 'sampleType', 'price'],
  medium: ['code', 'name', 'loincCodes', 'sampleType', 'price'],
  compact: ['code', 'name', 'price'],
} as const;

export const createCatalogTableConfig = (_navigate: NavigateFunction): TableViewConfig<Test> => {
  const columnMap = {
    code: {
      key: 'code',
      header: 'Code',
      width: 'id' as const,
      sortable: true,
      accessor: (test: Test) => test.code,
      render: (test: Test) => (
        <EntityId variant="block">{test.code}</EntityId>
      ),
    },
    name: {
      key: 'name',
      header: 'Test Name',
      width: 'fill' as const,
      sortable: true,
      truncate: true,
      accessor: (test: Test) => test.name,
      render: (test: Test) => (
        <div className="min-w-0 font-normal">
          <div className="text-text-primary truncate font-normal">{test.name}</div>
          {test.synonyms && test.synonyms.length > 0 && (
            <div className="text-xs text-text-tertiary truncate font-normal">
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
      width: 'sm' as const,
      accessor: (test: Test) => test.loincCodes?.join(', ') ?? '',
      render: (test: Test) => {
        if (!test.loincCodes || test.loincCodes.length === 0) {
          return <div className="text-xs text-text-disabled truncate font-normal">-</div>;
        }
        return (
          <div className="text-xs text-text-primary truncate font-normal">
            {test.loincCodes.join(', ')}
          </div>
        );
      },
    },
    category: {
      key: 'category',
      header: 'Category',
      width: 'lg' as const,
      sortable: true,
      accessor: (test: Test) => test.category,
      render: (test: Test) => <Badge variant={test.category} size="sm" className="border-none" />,
    },
    sampleType: {
      key: 'sampleType',
      header: 'Sample Type',
      width: 'sm' as const,
      sortable: true,
      accessor: (test: Test) => test.sampleType,
      render: (test: Test) => <Badge variant={test.sampleType} size="sm" />,
    },
    price: {
      key: 'price',
      header: 'Price',
      width: 'sm' as const,
      sortable: true,
      accessor: (test: Test) => test.price,
      render: (test: Test) => (
        <div className={`${DATA_AMOUNT} truncate font-normal`}>{formatCurrency(test.price)}</div>
      ),
    },
  };

  return {
    ...buildViews(columnMap, CATALOG_VIEWS, {
      medium: { loincCodes: 'md', sampleType: 'sm' },
    }),
    CardComponent: CatalogCard,
  };
};
