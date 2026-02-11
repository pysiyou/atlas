import type { TableCellProps } from './types';
import { getColumnStyle } from './hooks/useColumnWidth';
import { CELL_PADDING, TEXT_SIZE } from './constants';

/**
 * Table Cell Component
 * Renders individual table cells with proper styling and alignment
 */
export function TableCell({ column, children, variant }: TableCellProps) {
  const style = getColumnStyle(column);

  // Alignment for outer cell and inner content wrapper
  const alignClass =
    column.align === 'center'
      ? 'text-center justify-center'
      : column.align === 'right'
        ? 'text-right justify-end'
        : 'text-left justify-start';
  const innerJustifyClass =
    column.align === 'center'
      ? 'justify-center'
      : column.align === 'right'
        ? 'justify-end'
        : 'justify-start';

  // Handle sticky positioning
  const stickyClass =
    column.sticky === 'left'
      ? 'sticky left-0 bg-surface z-[1]'
      : column.sticky === 'right'
        ? 'sticky right-0 bg-surface z-[1]'
        : '';

  // Apply truncation if enabled
  const contentClass = column.truncate ? 'truncate' : '';

  return (
    <div
      className={`
        ${CELL_PADDING[variant]} 
        ${TEXT_SIZE[variant]}
        text-text-primary
        overflow-hidden
        flex items-center
        ${alignClass}
        ${contentClass}
        ${stickyClass}
        ${column.className || ''}
      `.trim()}
      style={style}
    >
      <div className={`min-w-0 flex-1 flex items-center ${innerJustifyClass}`}>{children}</div>
    </div>
  );
}
