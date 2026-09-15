/**
 * Panel — titled section shell for detail pages, dashboard, command center, and lab modals.
 */

import React from 'react';
import { cn } from '@/utils';
import {
  PANEL_SCROLL,
  PANEL_SPACING,
  PANEL_VARIANTS,
  type PanelPadding,
  type PanelScroll,
  type PanelSpacing,
  type PanelVariant,
} from './panelTokens';

export type { PanelPadding, PanelScroll, PanelSpacing, PanelVariant };

export interface PanelProps {
  /** Visual recipe. `page` is the default dashboard/detail shell; `lab` is compact modal/grid. */
  variant?: PanelVariant;
  title?: string | React.ReactNode;
  meta?: string;
  headerStart?: React.ReactNode;
  headerEnd?: React.ReactNode;
  children: React.ReactNode;
  /** Body inset. Defaults per variant (`page` 16px, `lab` 8px). Use `none` for embedded tables. */
  padding?: PanelPadding;
  /** Body overflow. `default` keeps the variant body token; `auto`/`visible` override it. */
  scroll?: PanelScroll;
  /** Vertical gap between body children. Defaults to `none` (`page`) or `normal` (`lab`). */
  spacing?: PanelSpacing;
  hideHeader?: boolean;
  className?: string;
  bodyClassName?: string;
  testId?: string;
}

export function Panel({
  variant = 'page',
  title,
  meta,
  headerStart,
  headerEnd,
  children,
  padding = 'default',
  scroll = 'default',
  spacing,
  hideHeader = false,
  className,
  bodyClassName,
  testId,
}: PanelProps) {
  const tokens = PANEL_VARIANTS[variant];
  const resolvedSpacing = spacing ?? (variant === 'lab' ? 'normal' : 'none');
  const useBetweenLayout = Boolean(meta || headerEnd);
  const headerClass = useBetweenLayout ? tokens.headerBetween : tokens.header;

  const titleNode =
    title == null || title === ''
      ? null
      : typeof title === 'string'
        ? <h3 className={tokens.title}>{title}</h3>
        : <div className={tokens.title}>{title}</div>;

  return (
    <section className={cn(tokens.shell, className)} data-testid={testId}>
      {!hideHeader && (
        <div className={headerClass}>
          {headerStart}
          {titleNode}
          {meta && <span className={tokens.meta}>{meta}</span>}
          {headerEnd != null && <div className={tokens.headerActions}>{headerEnd}</div>}
        </div>
      )}
      <div
        className={cn(
          tokens.body,
          padding === 'none' ? 'p-0' : tokens.padding,
          scroll === 'default' ? tokens.scrollDefault : PANEL_SCROLL[scroll],
          PANEL_SPACING[resolvedSpacing],
          bodyClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}
