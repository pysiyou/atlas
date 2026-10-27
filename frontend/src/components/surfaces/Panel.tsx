/**
 * Panel — titled section shell. Chrome and titles come from panel presets.
 */
/* eslint-disable react-refresh/only-export-components -- Panel + preset re-exports */

import React, { type ReactNode } from 'react';
import { PANEL_SHELL } from '@/theme/recipes';
import { cn } from '@/utils';
import {
  PanelHeaderAsidePlaceholder,
  PanelLoadingBody,
  type PanelLoadingShape,
} from './panelLoading';
import {
  getPanelPreset,
  PANEL_BODY_LAYOUT,
  PANEL_SCROLL,
  PANEL_SHELL_LAYOUT,
  PANEL_SPACING,
  type PanelPresetId,
  type PanelVariant,
} from '@/config/panelLayouts';

export type { PanelPresetId, PanelScroll, PanelSpacing, PanelVariant } from '@/config/panelLayouts';
export { getPanelPreset, PANEL_PRESETS } from '@/config/panelLayouts';

function isCompactPanelVariant(variant: PanelVariant): boolean {
  return variant === 'compact' || variant === 'compactEmbed';
}

export interface PanelProps {
  preset: PanelPresetId;
  /** Section heading (required for visible headers; omit when preset hides the header). */
  title?: string;
  /**
   * Optional caption on the **right** of the header (counts, hints, scope).
   * Prefer this over a second title; pair with `headerEnd` for actions.
   */
  meta?: string;
  headerStart?: React.ReactNode;
  headerEnd?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  testId?: string;
  /** When true, render a sized body placeholder instead of children. */
  loading?: boolean;
  loadingShape?: PanelLoadingShape;
  loadingRows?: number;
  loadingTableColumns?: number;
  loadingTableRows?: number;
  loadingFieldLayout?: 'grid' | 'column';
  loadingContent?: ReactNode;
  /** Reserve header aside width with a skeleton (e.g. actions/links). */
  loadingHeaderAside?: boolean;
}

export function Panel({
  preset,
  title,
  meta,
  headerStart,
  headerEnd,
  children,
  footer,
  testId,
  loading = false,
  loadingShape,
  loadingRows,
  loadingTableColumns,
  loadingTableRows,
  loadingFieldLayout,
  loadingContent,
  loadingHeaderAside = false,
}: PanelProps) {
  const def = getPanelPreset(preset);
  const tokens = PANEL_SHELL[def.variant];
  const scroll = def.scroll ?? 'default';
  const resolvedSpacing = def.spacing ?? (isCompactPanelVariant(def.variant) ? 'normal' : 'none');
  const resolvedMeta = meta ?? def.meta;
  const showHeaderAsideSkeleton = loading && loadingHeaderAside;
  const hasHeaderAside = Boolean(resolvedMeta || headerEnd || showHeaderAsideSkeleton);
  const headerClass = hasHeaderAside ? tokens.headerBetween : tokens.header;
  const hasFooter = footer != null && footer !== false;
  const hideHeader = def.hideHeader === true;

  const resolvedTitle = title ?? def.title;
  const titleNode =
    def.headingSlot || resolvedTitle === ''
      ? null
      : <h3 className={tokens.title}>{resolvedTitle}</h3>;

  const bodyScrollClass =
    scroll === 'default' ? tokens.scrollDefault : PANEL_SCROLL[scroll];

  return (
    <section
      className={cn(
        tokens.shell,
        PANEL_SHELL_LAYOUT[def.shellLayout ?? 'default'],
        def.maxHeightClass,
        hasFooter && !loading && 'flex flex-col min-h-0',
      )}
      data-testid={testId}
      aria-busy={loading || undefined}
    >
      {!hideHeader && (
        <div className={headerClass}>
          <div className={tokens.headerLead}>
            {def.headingSlot && headerStart != null ? (
              <div className={tokens.title}>{headerStart}</div>
            ) : (
              headerStart
            )}
            {titleNode}
          </div>
          {hasHeaderAside ? (
            <div className={tokens.headerAside}>
              {resolvedMeta ? (
                <span className={cn(tokens.meta, 'min-w-0 text-right')}>{resolvedMeta}</span>
              ) : null}
              {showHeaderAsideSkeleton ? (
                <div className={tokens.headerActions}>
                  <PanelHeaderAsidePlaceholder />
                </div>
              ) : headerEnd != null ? (
                <div className={tokens.headerActions}>{headerEnd}</div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
      <div
        className={cn(
          tokens.body,
          hasFooter && 'flex-1 min-h-0',
          bodyScrollClass,
          PANEL_SPACING[resolvedSpacing],
          PANEL_BODY_LAYOUT[def.bodyLayout ?? 'default'],
        )}
      >
        {loading ? (
          <PanelLoadingBody
            shape={loadingShape}
            rows={loadingRows}
            tableColumns={loadingTableColumns}
            tableRows={loadingTableRows}
            fieldLayout={loadingFieldLayout}
            content={loadingContent}
          />
        ) : (
          children
        )}
      </div>
      {hasFooter && !loading ? <div className={tokens.footer}>{footer}</div> : null}
    </section>
  );
}
