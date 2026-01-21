/**
 * Catalog Table Column Definitions
 * Column configuration for the test catalog list table
 */

import type { NavigateFunction } from 'react-router-dom';
import { Badge, TableActionMenu, TableActionItem, Icon } from '@/shared/ui';
import { formatCurrency } from '@/utils';
import type { Test } from '@/types';

/**
 * Format turnaround time for display
 * @param hours - Turnaround time in hours
 * @returns Formatted string (e.g., "2h", "24h", "2-3 days")
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
 * Generate table column definitions for catalog list
 * @param navigate - React Router navigate function
 * @returns Array of column definitions
 */
export const getCatalogTableColumns = (navigate: NavigateFunction) => [
  {
    key: 'code',
    header: 'Code',
    width: '10%',
    sortable: true,
    render: (test: Test) => (
      <span className="text-xs text-sky-600 font-medium font-mono truncate block">
        {test.code}
      </span>
    ),
  },
  {
    key: 'name',
    header: 'Test Name',
    width: '30%',
    sortable: true,
    render: (test: Test) => (
      <div className="min-w-0">
        <div className="font-semibold text-gray-900 truncate">{test.name}</div>
        {test.synonyms && test.synonyms.length > 0 && (
          <div className="text-xs text-gray-500 truncate">
            {test.synonyms.slice(0, 2).join(', ')}
            {test.synonyms.length > 2 && ` +${test.synonyms.length - 2} more`}
          </div>
        )}
      </div>
    ),
  },
  {
    key: 'category',
    header: 'Category',
    width: '12%',
    sortable: true,
    render: (test: Test) => (
      <Badge
        variant={test.category}
        size="sm"
        className="border-none font-medium"
      />
    ),
  },
  {
    key: 'sampleType',
    header: 'Sample Type',
    width: '12%',
    sortable: true,
    render: (test: Test) => (
      <Badge
        variant={test.sampleType}
        size="sm"
      />
    ),
  },
  {
    key: 'turnaroundTime',
    header: 'TAT',
    width: '8%',
    sortable: true,
    render: (test: Test) => (
      <div className="text-xs text-gray-700 truncate">
        {formatTurnaroundTime(test.turnaroundTime)}
      </div>
    ),
  },
  {
    key: 'price',
    header: 'Price',
    width: '10%',
    sortable: true,
    render: (test: Test) => (
      <div className="font-medium text-sky-600 truncate">
        {formatCurrency(test.price)}
      </div>
    ),
  },
  {
    key: 'isActive',
    header: 'Status',
    width: '8%',
    sortable: true,
    render: (test: Test) => (
      <Badge
        variant={test.isActive ? 'success' : 'default'}
        size="sm"
      >
        {test.isActive ? 'ACTIVE' : 'INACTIVE'}
      </Badge>
    ),
  },
  {
    key: 'actions',
    header: '',
    width: '5%',
    className: 'overflow-visible !px-1',
    headerClassName: '!px-1',
    render: (test: Test) => (
      <TableActionMenu>
        <TableActionItem
          label="View Details"
          icon={<Icon name="eye" className="w-4 h-4" />}
          onClick={() => navigate(`/catalog/${test.code}`)}
        />
      </TableActionMenu>
    ),
  },
];
