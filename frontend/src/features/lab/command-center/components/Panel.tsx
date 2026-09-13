/**
 * Command center panel shell.
 */

import React from 'react';
import { cn } from '@/utils';
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
