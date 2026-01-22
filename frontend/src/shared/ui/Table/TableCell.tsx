import type { TableCellProps } from './types';
import { getColumnStyle } from './hooks/useColumnWidth';
import { CELL_PADDING, TEXT_SIZE } from './constants';

/**
 * Table Cell Component
 * Renders individual table cells with proper styling and alignment
 */
export function TableCell({
  column,
  children,
  variant,
}: TableCellProps) {
  const style = getColumnStyle(column);

  // Determine alignment classes
  const alignClass =
    column.align === 'center'
      ? 'text-center'
      : column.align === 'right'
      ? 'text-right'
      : 'text-left';

  // Handle sticky positioning
  const stickyClass =
    column.sticky === 'left'
      ? 'sticky left-0 bg-white z-[1]'
      : column.sticky === 'right'
      ? 'sticky right-0 bg-white z-[1]'
      : '';

  // Apply truncation if enabled
  const contentClass = column.truncate ? 'truncate' : '';

  return (
    <div
      className={`
        ${CELL_PADDING[variant]} 
        ${TEXT_SIZE[variant]}
        text-gray-900
        overflow-hidden
        ${alignClass}
        ${contentClass}
        ${stickyClass}
        ${column.className || ''}
      `.trim()}
      style={style}
    >
      {children}
    </div>
  );
}
