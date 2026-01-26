import React from 'react';
import { IconButton } from './IconButton';
import { Popover } from './Popover';

interface TableActionMenuProps {
  children: React.ReactNode;
}

/**
 * TableActionMenu trigger and action list.
 * Uses shared Popover (FloatingPortal, useDismiss) so the menu renders above
 * sticky table cells and closes on outside click / Escape.
 */
export const TableActionMenu: React.FC<TableActionMenuProps> = ({ children }) => {
  return (
    <div onClick={e => e.stopPropagation()}>
      <Popover
        trigger={<IconButton variant="menu" size="sm" title="Actions" />}
        placement="bottom-end"
        offsetValue={8}
        showBackdrop={false}
        className="w-48 py-1"
      >
        {({ close }) => (
          <div onClick={close}>
            {children}
          </div>
        )}
      </Popover>
    </div>
  );
};

interface TableActionItemProps {
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
  variant?: 'default' | 'danger';
}

export const TableActionItem: React.FC<TableActionItemProps> = ({
  onClick,
  icon,
  label,
  variant = 'default',
}) => {
  return (
    <button
      onClick={() => {
        onClick();
      }}
      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-app-bg transition-colors cursor-pointer ${
        variant === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-text-secondary'
      }`}
    >
      {icon && (
        <span
          className={`inline-flex w-5 h-5 shrink-0 items-center justify-center ${
            variant === 'danger' ? 'text-red-600' : 'text-text-muted'
          }`}
        >
          {icon}
        </span>
      )}
      <span className="flex-1 min-w-0">{label}</span>
    </button>
  );
};
