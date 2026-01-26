/**
 * Catalog Table Configuration
 *
 * Multi-view table configuration for test catalog list.
 * Defines separate column sets for full table, compact table, and mobile card view.
 */

import type { NavigateFunction } from 'react-router-dom';
import { Badge, TableActionMenu, TableActionItem, Icon } from '@/shared/ui';
import type { TableViewConfig } from '@/shared/ui/Table';
import { formatCurrency } from '@/utils';
import type { Test } from '@/types';
import { ICONS } from '@/utils/icon-mappings';
import { CatalogCard } from '../components/cards/CatalogCard';

/**
 * Create catalog table configuration with full, compact, and card views
 *
 * @param navigate - React Router navigate function
 * @returns TableViewConfig with fullColumns, compactColumns, and CardComponent
 */
// Large function is necessary to define multiple table column configurations (full, compact, card views) with render functions
// eslint-disable-next-line max-lines-per-function
export const createCatalogTableConfig = (navigate: NavigateFunction): TableViewConfig<Test> => {
  // Shared render functions
  const renderCode = (test: Test) => (
    <span className="text-xs text-sky-600 font-medium font-mono truncate block">{test.code}</span>
  );

  const renderName = (test: Test) => (
    <div className="min-w-0">
      <div className="font-semibold text-text-primary truncate">{test.name}</div>
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
      <div className="text-xs text-text-primary truncate font-semibold">
        {test.loincCodes.join(', ')}
      </div>
    );
  };

  const renderPrice = (test: Test) => (
    <div className="font-medium text-brand truncate">{formatCurrency(test.price)}</div>
  );

  const renderActions = (test: Test) => (
    <TableActionMenu>
      <TableActionItem
        label="View Details"
        icon={<Icon name={ICONS.actions.view} className="w-4 h-4" />}
        onClick={() => navigate(`/catalog/${test.code}`)}
      />
    </TableActionMenu>
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
      {
        key: 'actions',
        header: '',
        width: 'xs',
        sticky: 'right',
        className: 'overflow-visible !px-1',
        headerClassName: '!px-1',
        render: renderActions,
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
      {
        key: 'actions',
        header: '',
        width: 'xs',
        sticky: 'right',
        className: 'overflow-visible !px-1',
        headerClassName: '!px-1',
        render: renderActions,
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
      {
        key: 'actions',
        header: '',
        width: 'xs',
        sticky: 'right',
        className: 'overflow-visible !px-1',
        headerClassName: '!px-1',
        render: renderActions,
      },
    ],
    CardComponent: CatalogCard,
  };
};
