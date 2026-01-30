import type { TableBodyProps, ColumnConfig } from './types';
import { TableCell } from './TableCell';
import { ROW_HEIGHTS } from './constants';

/**
 * Table row styles
 */
const tableRow = {
  base: 'flex items-center border-b border-border-default transition-colors duration-200',
  clickable: 'cursor-pointer',
  hover: 'hover:bg-surface-hover',
  striped: 'bg-neutral-50',
};

/**
 * Table Row Component
 * Renders a single table row with cells for visible columns
 */
export function TableRow<T>({
  data,
  visibleColumns,
  variant,
  striped = false,
  onRowClick,
  rowClassName,
  getRowKey,
}: TableBodyProps<T>) {
  return (
    <>
      {data.map((item, index) => {
        const rowKey = getRowKey ? getRowKey(item, index) : index;
        const isClickable = !!onRowClick;
        const isStriped = striped && index % 2 === 0;

        return (
          <div
            key={rowKey}
            className={`${tableRow.base} ${isClickable ? `${tableRow.clickable} ${tableRow.hover}` : ''} ${isStriped ? tableRow.striped : ''} ${rowClassName ? rowClassName(item, index) : ''}`}
            style={{ height: `${ROW_HEIGHTS[variant]}px` }}
            onClick={() => onRowClick?.(item, index)}
          >
            {visibleColumns.map(column => (
              <TableCell
                key={column.key}
                column={column as ColumnConfig<unknown>}
                variant={variant}
              >
                {column.render ? (
                  column.render(item, index)
                ) : (
                  <span className={column.truncate ? 'block truncate' : ''}>
                    {String((item as Record<string, unknown>)[column.key] ?? '')}
                  </span>
                )}
              </TableCell>
            ))}
          </div>
        );
      })}
    </>
  );
}
