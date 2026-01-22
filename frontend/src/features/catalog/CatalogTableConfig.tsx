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
import { CatalogCard } from './CatalogCard';

/**
 * Format turnaround time for display
 */
const formatTurnaroundTime = (hours: number): string => {
  if (hours < 24) {
    return `${hours}h`;
  } else if (hours === 24) {
    return '1 day';
  } else if (hours < 168) {
    const days = Math.round(hours / 24);
    return `${days} day${days > 1 ? 's' : ''}`;
  } else {
    const weeks = Math.round(hours / 168);
    return `${weeks} week${weeks > 1 ? 's' : ''}`;
  }
};

/**
 * Create catalog table configuration with full, compact, and card views
 * 
 * @param navigate - React Router navigate function
 * @returns TableViewConfig with fullColumns, compactColumns, and CardComponent
 */
export const createCatalogTableConfig = (
  navigate: NavigateFunction
): TableViewConfig<Test> => {
  // Shared render functions
  const renderCode = (test: Test) => (
    <span className="text-xs text-sky-600 font-medium font-mono truncate block">
      {test.code}
    </span>
  );

  const renderName = (test: Test) => (
    <div className="min-w-0">
      <div className="font-semibold text-gray-900 truncate">{test.name}</div>
      {test.synonyms && test.synonyms.length > 0 && (
        <div className="text-xs text-gray-500 truncate">
          {test.synonyms.slice(0, 2).join(', ')}
          {test.synonyms.length > 2 && ` +${test.synonyms.length - 2} more`}
        </div>
      )}
    </div>
  );

  const renderCategory = (test: Test) => (
    <Badge
      variant={test.category}
      size="sm"
      className="border-none font-medium"
    />
  );

  const renderSampleType = (test: Test) => (
    <Badge
      variant={test.sampleType}
      size="sm"
    />
  );

  const renderTurnaroundTime = (test: Test) => (
    <div className="text-xs text-gray-700 truncate">
      {formatTurnaroundTime(test.turnaroundTime)}
    </div>
  );

  const renderPrice = (test: Test) => (
    <div className="font-medium text-sky-600 truncate">
      {formatCurrency(test.price)}
    </div>
  );

  const renderStatus = (test: Test) => (
    <Badge
      variant={test.isActive ? 'success' : 'default'}
      size="sm"
    >
      {test.isActive ? 'ACTIVE' : 'INACTIVE'}
    </Badge>
  );

  const renderActions = (test: Test) => (
    <TableActionMenu>
      <TableActionItem
        label="View Details"
        icon={<Icon name="eye" className="w-4 h-4" />}
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
        key: 'category',
        header: 'Category',
        width: 'md',
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
        key: 'turnaroundTime',
        header: 'TAT',
        width: 'xs',
        sortable: true,
        render: renderTurnaroundTime,
      },
      {
        key: 'price',
        header: 'Price',
        width: 'sm',
        sortable: true,
        render: renderPrice,
      },
      {
        key: 'isActive',
        header: 'Status',
        width: 'sm',
        sortable: true,
        render: renderStatus,
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
        key: 'category',
        header: 'Category',
        width: 'md',
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
        key: 'isActive',
        header: 'Status',
        width: 'sm',
        sortable: true,
        render: renderStatus,
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
      {
        key: 'category',
        header: 'Category',
        width: 'md',
        sortable: true,
        render: renderCategory,
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
    CardComponent: CatalogCard,
  };
};
