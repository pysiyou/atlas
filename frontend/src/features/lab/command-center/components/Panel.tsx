/**
 * Command center panel shell and state placeholders.
 */

import React from 'react';
import { cn } from '@/utils';
import { COMMAND_CENTER_TIMELINE } from '@/features/lab/timeline/timelineStyles';
import { COMMAND_CENTER_PANEL } from './styles';

export function Panel({
  title,
  meta,
  headerActions,
  children,
  className,
}: {
  title: string;
  meta?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const headerClass = meta ? COMMAND_CENTER_PANEL.headerBetween : COMMAND_CENTER_PANEL.header;

  return (
    <div className={cn(COMMAND_CENTER_PANEL.shell, className)}>
      <div className={headerClass}>
        <h3 className={COMMAND_CENTER_PANEL.title}>{title}</h3>
        {meta && <span className={COMMAND_CENTER_PANEL.meta}>{meta}</span>}
        {headerActions}
      </div>
      {children}
    </div>
  );
}

export function PanelBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn(COMMAND_CENTER_PANEL.body, className)}>{children}</div>;
}

export function PanelError({
  message,
  onRetry,
  retryLabel = 'Retry',
}: {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <p className="text-xs text-text-secondary">{message}</p>
      {onRetry && (
        <button type="button" onClick={() => void onRetry()} className={COMMAND_CENTER_TIMELINE.retryLink}>
          {retryLabel}
        </button>
      )}
    </div>
  );
}

export function PanelEmpty({ message }: { message: string }) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center py-8">
      <p className="text-xs text-text-tertiary">{message}</p>
    </div>
  );
}

export function DonutPanelLayout({
  donut,
  children,
}: {
  donut: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 items-center gap-3 overflow-hidden px-3 py-2">
      {donut}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
