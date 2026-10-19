/**
 * Panel — titled section shell. Chrome and titles come from panel presets.
 */
/* eslint-disable react-refresh/only-export-components -- Panel + preset re-exports */

import React from 'react';
import { PANEL_SHELL } from '@/components/theme/recipes';
import { cn } from '@/utils';
import {
  getPanelPreset,
  PANEL_BODY_LAYOUT,
  PANEL_SCROLL,
  PANEL_SHELL_LAYOUT,
  PANEL_SPACING,
  type PanelPresetId,
  type PanelVariant,
} from './panelPresets';

export type { PanelPresetId, PanelScroll, PanelSpacing, PanelVariant } from './panelPresets';
export { getPanelPreset, PANEL_PRESETS } from './panelPresets';

function isLabVariant(variant: PanelVariant): boolean {
  return variant === 'lab' || variant === 'labEmbed';
}

export interface PanelProps {
  preset: PanelPresetId;
  /** Dynamic counts or status. Overrides the preset's static meta when set. */
  meta?: string;
  headerStart?: React.ReactNode;
  headerEnd?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  testId?: string;
}

export function Panel({
  preset,
  meta,
  headerStart,
  headerEnd,
  children,
  footer,
  testId,
}: PanelProps) {
  const def = getPanelPreset(preset);
  const tokens = PANEL_SHELL[def.variant];
  const scroll = def.scroll ?? 'default';
  const resolvedSpacing = def.spacing ?? (isLabVariant(def.variant) ? 'normal' : 'none');
  const resolvedMeta = meta ?? def.meta;
  const useBetweenLayout = Boolean(resolvedMeta || headerEnd);
  const headerClass = useBetweenLayout ? tokens.headerBetween : tokens.header;
  const hasFooter = footer != null && footer !== false;
  const hideHeader = def.hideHeader === true;

  const titleNode =
    def.headingSlot || def.title === ''
      ? null
      : <h3 className={tokens.title}>{def.title}</h3>;

  const bodyScrollClass =
    scroll === 'default' ? tokens.scrollDefault : PANEL_SCROLL[scroll];

  return (
    <section
      className={cn(
        tokens.shell,
        PANEL_SHELL_LAYOUT[def.shellLayout ?? 'default'],
        def.maxHeightClass,
        hasFooter && 'flex flex-col min-h-0',
      )}
      data-testid={testId}
    >
      {!hideHeader && (
        <div className={headerClass}>
          {def.headingSlot && headerStart != null ? (
            <div className={tokens.title}>{headerStart}</div>
          ) : (
            headerStart
          )}
          {titleNode}
          {resolvedMeta && <span className={tokens.meta}>{resolvedMeta}</span>}
          {headerEnd != null && <div className={tokens.headerActions}>{headerEnd}</div>}
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
        {children}
      </div>
      {hasFooter ? <div className={tokens.footer}>{footer}</div> : null}
    </section>
  );
}
