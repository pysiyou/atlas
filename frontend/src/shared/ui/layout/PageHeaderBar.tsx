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
      className={`shrink-0 w-full flex items-center justify-between gap-4 flex-wrap py-3 px-4 rounded-t-lg bg-panel border-b border-stroke ${className}`}
      role="banner"
    >
      <div className="min-w-0">
        <h1 className="text-lg font-medium text-fg truncate">{title}</h1>
        {subtitle != null && (
          <p className="text-sm text-fg-subtle mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
      {children != null && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </header>
  );
};
