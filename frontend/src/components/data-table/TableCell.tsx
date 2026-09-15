import { getColumnStyle } from '@/hooks/useTable';
import type { TableCellProps } from './types';
import { CELL_PADDING, TEXT_SIZE } from './constants';

export function TableCell({ column, children, variant }: TableCellProps) {
  const style = getColumnStyle(column);
  const alignClass =
    column.align === 'center'
      ? 'text-center justify-center'
      : column.align === 'right'
        ? 'text-right justify-end'
        : 'text-left justify-start';
  const innerJustifyClass =
    column.align === 'center' ? 'justify-center' : column.align === 'right' ? 'justify-end' : 'justify-start';
  const stickyClass =
    column.sticky === 'left'
      ? 'sticky left-0 bg-surface z-[1]'
      : column.sticky === 'right'
        ? 'sticky right-0 bg-surface z-[1]'
        : '';
  const contentClass = column.truncate ? 'truncate' : '';
  return (
    <div
      className={`${CELL_PADDING[variant]} ${TEXT_SIZE[variant]} text-text-primary overflow-hidden flex items-center ${alignClass} ${contentClass} ${stickyClass} ${column.className || ''}`.trim()}
      style={style}
    >
      <div className={`min-w-0 flex-1 flex items-center ${innerJustifyClass}`}>{children}</div>
    </div>
  );
}
