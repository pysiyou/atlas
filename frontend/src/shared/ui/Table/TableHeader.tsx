import { Icon } from '../display/Icon';
import type { TableHeaderProps } from './types';
import { useColumnStyles } from './hooks/useColumnWidth';
import { HEADER_PADDING, TEXT_SIZE } from './constants';
import { ICONS } from '@/utils';

/**
 * Table Header Component
 * Renders table headers with sort indicators and click handlers
 */
export function TableHeader<T>({
  visibleColumns,
  sort,
  onSort,
  variant,
  sticky = false,
}: TableHeaderProps<T>) {
  const columnStyles = useColumnStyles(visibleColumns);

  return (
    <div
      className={`flex items-stretch border-b border-border bg-app-bg flex items-center font-medium ${TEXT_SIZE[variant]} text-text-tertiary uppercase tracking-wider ${sticky ? 'sticky top-0 z-10' : ''}`}
    >
      {visibleColumns.map(column => {
        const style = columnStyles.get(column.key) || {};
        const isSortable = column.sortable;
        const isActiveSort = sort?.key === column.key;

        return (
          <div
            key={column.key}
            className={`
              ${HEADER_PADDING[variant]} 
              text-xxs flex items-center justify-start gap-2 whitespace-nowrap
              ${isSortable ? 'cursor-pointer hover:bg-neutral-100 select-none' : ''}
              ${isActiveSort ? 'text-text-primary bg-neutral-100' : ''}
              ${column.headerClassName || ''}
            `.trim()}
            style={style}
            onClick={() => isSortable && onSort(column.key)}
            aria-sort={
              isActiveSort
                ? sort?.direction === 'asc'
                  ? 'ascending'
                  : 'descending'
                : isSortable
                  ? 'none'
                  : undefined
            }
          >
            <span>{column.header}</span>
            {isActiveSort && (
              <Icon
                name={sort.direction === 'asc' ? ICONS.actions.arrowUp : ICONS.actions.arrowDown}
                className="w-3.5 h-3.5"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
