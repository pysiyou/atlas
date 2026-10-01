/**
 * Panel — titled section shell for detail pages, dashboard, command center, and lab modals.
 */
/* eslint-disable react-refresh/only-export-components -- single module: Panel + variant tokens */

import React from 'react';
import { PANEL_SHELL, SPACING } from '@/components/theme/recipes';
import { cn } from '@/utils';

export type PanelVariant = keyof typeof PANEL_SHELL;
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

function isLabVariant(variant: PanelVariant): boolean {
  return variant === 'lab' || variant === 'labEmbed';
}

export interface PanelProps {
  /** Visual recipe — padding and chrome come from the variant tokens in `PANEL_SHELL`. */
  variant?: PanelVariant;
  title?: string | React.ReactNode;
  meta?: string;
  headerStart?: React.ReactNode;
  headerEnd?: React.ReactNode;
  children: React.ReactNode;
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
  scroll = 'default',
  spacing,
  hideHeader = false,
  className,
  bodyClassName,
  testId,
}: PanelProps) {
  const tokens = PANEL_SHELL[variant];
  const resolvedSpacing = spacing ?? (isLabVariant(variant) ? 'normal' : 'none');
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
