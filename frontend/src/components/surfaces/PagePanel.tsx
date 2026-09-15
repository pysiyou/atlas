/**
 * PagePanel — titled section shell shared with lab command center panels.
 */

import React from 'react';
import { cn } from '@/utils';
import { PAGE_PANEL } from './pagePanelStyles';

export interface PagePanelProps {
  title: string | React.ReactNode;
  meta?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PagePanel({ title, meta, headerActions, children, className }: PagePanelProps) {
  const useBetweenLayout = Boolean(meta || headerActions);
  const headerClass = useBetweenLayout ? PAGE_PANEL.headerBetween : PAGE_PANEL.header;

  return (
    <div className={cn(PAGE_PANEL.shell, className)}>
      <div className={headerClass}>
        {typeof title === 'string' ? (
          <h3 className={PAGE_PANEL.title}>{title}</h3>
        ) : (
          <div className={PAGE_PANEL.title}>{title}</div>
        )}
        {meta && <span className={PAGE_PANEL.meta}>{meta}</span>}
        {headerActions != null && (
          <div className={PAGE_PANEL.headerActions}>{headerActions}</div>
        )}
      </div>
      {children}
    </div>
  );
}

export function PagePanelBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(PAGE_PANEL.body, className)}>{children}</div>;
}
