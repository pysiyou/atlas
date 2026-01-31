/**
 * Catalog Table Configuration
 *
 * Multi-view table configuration for test catalog list.
 * Defines separate column sets for full table, compact table, and mobile card view.
 */

import type { NavigateFunction } from 'react-router-dom';
import { Badge } from '@/shared/ui';
import type { TableViewConfig } from '@/shared/ui/Table';
import { formatCurrency } from '@/utils';
import type { Test } from '@/types';
import { DATA_AMOUNT, DATA_ID_PRIMARY } from '@/shared/constants';
import { CatalogCard } from '../components/CatalogCard';

/**
 * Create catalog table configuration with full, compact, and card views
 *
 * @param navigate - React Router navigate function
 * @returns TableViewConfig with fullColumns, compactColumns, and CardComponent
 */
// Large function is necessary to define multiple table column configurations (full, compact, card views) with render functions
 
export const createCatalogTableConfig = (_navigate: NavigateFunction): TableViewConfig<Test> => {
  // Shared render functions
  const renderCode = (test: Test) => (
    <span className={DATA_ID_PRIMARY}>{test.code}</span>
  );

  const renderName = (test: Test) => (
    <div className="min-w-0">
      <div className="text-text-primary truncate">{test.name}</div>
      {test.synonyms && test.synonyms.length > 0 && (
        <div className="text-xs text-text-tertiary truncate">
          {test.synonyms.slice(0, 2).join(', ')}
          {test.synonyms.length > 2 && ` +${test.synonyms.length - 2} more`}
        </div>
      )}
    </div>
  );

  const renderCategory = (test: Test) => (
    <Badge variant={test.category} size="sm" className="border-none font-medium" />
  );

  const renderSampleType = (test: Test) => <Badge variant={test.sampleType} size="sm" />;

  const renderLoincCodes = (test: Test) => {
    if (!test.loincCodes || test.loincCodes.length === 0) {
      return <div className="text-xs text-text-disabled truncate">-</div>;
    }
    return (
      <div className="text-xs text-text-primary truncate">
        {test.loincCodes.join(', ')}
      </div>
    );
  };

  const renderPrice = (test: Test) => (
    <div className={`${DATA_AMOUNT} truncate`}>{formatCurrency(test.price)}</div>
  );

  return {
    fullColumns: [
      {
        key: 'code',
        header: 'Code',
        width: 'sm',
        sortable: true,
        render: renderCode,
      },
      {
        key: 'name',
        header: 'Test Name',
        width: 'fill',
        sortable: true,
        truncate: true,
        render: renderName,
      },
      {
        key: 'loincCodes',
        header: 'LOINC',
        width: 'sm',
        sortable: false,
        render: renderLoincCodes,
      },
      {
        key: 'category',
        header: 'Category',
        width: 'lg',
        sortable: true,
        render: renderCategory,
      },
      {
        key: 'sampleType',
        header: 'Sample Type',
        width: 'sm',
        sortable: true,
        render: renderSampleType,
      },
      {
        key: 'price',
        header: 'Price',
        width: 'sm',
        sortable: true,
        render: renderPrice,
      },
    ],
    mediumColumns: [
      {
        key: 'code',
        header: 'Code',
        width: 'sm',
        sortable: true,
        render: renderCode,
      },
      {
        key: 'name',
        header: 'Test Name',
        width: 'fill',
        sortable: true,
        truncate: true,
        render: renderName,
      },
      {
        key: 'loincCodes',
        header: 'LOINC',
        width: 'md',
        sortable: false,
        render: renderLoincCodes,
      },
      // {
      //   key: 'category',
      //   header: 'Category',
      //   width: 'md',
      //   sortable: true,
      //   render: renderCategory,
      // },
      {
        key: 'sampleType',
        header: 'Sample',
        width: 'sm',
        sortable: true,
        render: renderSampleType,
      },
      {
        key: 'price',
        header: 'Price',
        width: 'sm',
        sortable: true,
        render: renderPrice,
      },
    ],
    compactColumns: [
      {
        key: 'code',
        header: 'Code',
        width: 'sm',
        sortable: true,
        render: renderCode,
      },
      {
        key: 'name',
        header: 'Test Name',
        width: 'fill',
        sortable: true,
        truncate: true,
        render: renderName,
      },
      // {
      //   key: 'category',
      //   header: 'Category',
      //   width: 'md',
      //   sortable: true,
      //   render: renderCategory,
      // },
      {
        key: 'price',
        header: 'Price',
        width: 'sm',
        sortable: true,
        render: renderPrice,
      },
    ],
    CardComponent: CatalogCard,
  };
};
