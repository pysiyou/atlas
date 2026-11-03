/**
 * DetailPageShell - Standard wrapper for detail pages.
 * When AppShell chrome is active, headers portal to the top row; the in-flow header slot uses
 * `contents` so flex gap does not reserve space under the chrome (same as list pages).
 *
 * Pass `loading` to child panels/cards/tables — this shell does not replace the page body.
 * Load failures should use `notify.show` (see list chrome hooks), not inline alerts here.
 */

import React, { type ReactNode } from 'react';
import { EmptyState } from '@/components/display';
import { IconKeys } from '@/config/icons';
import { WORKSPACE } from '@/theme/recipes';
import { useAppChromeMount } from './appChromeMount';
import { cn } from '@/utils';

export interface DetailPageShellProps {
  /** Header node (e.g. PageHeader or feature header wrapping it) */
  header: ReactNode;
  /** Main content — use `loading` on Panel/Card/DataTable children while data loads */
  children: ReactNode;
  /** Marks the scroll region as busy (sections should use their own placeholders). */
  loading?: boolean;
  /** When true, show EmptyState instead of content */
  notFound?: boolean;
  /** Title for not-found EmptyState */
  notFoundTitle?: string;
  /** Description for not-found EmptyState */
  notFoundDescription?: string;
  className?: string;
}

export const DetailPageShell: React.FC<DetailPageShellProps> = ({
  header,
  children,
  loading = false,
  notFound = false,
  notFoundTitle = 'Not Found',
  notFoundDescription,
  className = '',
}) => {
  const headerInChrome = useAppChromeMount() != null;
  const headerSlotClass = headerInChrome ? 'contents' : 'shrink-0';

  return (
    <div className={cn(WORKSPACE.page, className)}>
      <div className={headerSlotClass}>{header}</div>
      {notFound ? (
        <div className="flex-1 flex items-center justify-center min-h-0">
          <EmptyState
            icon={IconKeys.actions.alertCircle}
            title={notFoundTitle}
            description={notFoundDescription}
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-auto" aria-busy={loading || undefined}>
          {children}
        </div>
      )}
    </div>
  );
};
