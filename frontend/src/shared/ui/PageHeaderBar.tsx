/**
 * PageHeaderBar - Compact page header bar (title left, actions right)
 * Used across list/section pages for consistent header styling.
 */

import type { ReactNode } from 'react';

export interface PageHeaderBarProps {
  /** Page title (single h1 per page for a11y) */
  title: string;
  /** Optional subtitle below title */
  subtitle?: string;
  /** Right-side content: buttons, tabs, etc. */
  children?: ReactNode;
  /** Additional CSS classes for the bar wrapper */
  className?: string;
}

export const PageHeaderBar: React.FC<PageHeaderBarProps> = ({
  title,
  subtitle,
  children,
  className = '',
}) => {
  return (
    <header
      className={`shrink-0 h-12 min-h-12 max-h-12 w-full flex items-center justify-between gap-4 flex-nowrap py-2 px-4 rounded bg-panel border border-stroke ${className}`}
      role="banner"
    >
      <div className="min-w-0 flex-1 flex flex-col justify-center">
        <h1 className="text-lg font-light text-fg truncate leading-tight">{title}</h1>
        {subtitle != null && (
          <p className="text-sm text-fg-subtle truncate leading-tight">{subtitle}</p>
        )}
      </div>
      {children != null && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </header>
  );
};
