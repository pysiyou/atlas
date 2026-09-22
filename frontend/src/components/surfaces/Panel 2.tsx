/**
 * Panel — titled section shell for detail pages, dashboard, command center, and lab modals.
 */
/* eslint-disable react-refresh/only-export-components -- single module: Panel + variant tokens */

import React from 'react';
import { PANEL_LAYOUT, RADIUS, SHADOW, SPACING, SURFACE, TYPE } from '@/components/theme/recipes';
import { cn } from '@/utils';

export type PanelVariant = 'page' | 'lab';
export type PanelPadding = 'default' | 'none';
export type PanelScroll = 'default' | 'auto' | 'visible';
export type PanelSpacing = 'none' | 'compact' | 'normal' | 'relaxed';

export const PANEL_SPACING: Record<PanelSpacing, string> = {
  none: '',
  compact: SPACING.stackCompact,
  normal: SPACING.stackNormal,
  relaxed: SPACING.stackRelaxed,
};

export const PANEL_SCROLL: Record<Exclude<PanelScroll, 'default'>, string> = {
  auto: 'overflow-y-auto',
  visible: 'overflow-visible',
};

export const PANEL_VARIANTS = {
  page: {
    shell: `h-full ${SURFACE.raised} ${RADIUS.field} ${SHADOW.subtle} overflow-hidden flex flex-col`,
    header: PANEL_LAYOUT.pageHeader,
    headerBetween: PANEL_LAYOUT.pageHeaderBetween,
    title: `m-0 truncate leading-none ${TYPE.panelTitle}`,
    meta: `flex h-6 shrink-0 items-center ${TYPE.caption}`,
    headerActions: 'flex shrink-0 items-center min-h-0',
    body: 'flex-1 min-h-0',
    padding: PANEL_LAYOUT.pageBodyPadding,
    scrollDefault: 'overflow-hidden',
  },
  lab: {
    shell: `w-full ${SURFACE.recessed} ${RADIUS.card} overflow-hidden`,
    header: PANEL_LAYOUT.labHeader,
    headerBetween: PANEL_LAYOUT.labHeaderBetween,
    title: `m-0 truncate ${TYPE.sectionTitle}`,
    meta: `flex shrink-0 items-center ${TYPE.caption}`,
    headerActions: 'flex shrink-0 items-center min-h-0',
    body: '',
    padding: SPACING.pSpace2,
    scrollDefault: '',
  },
} as const;

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
