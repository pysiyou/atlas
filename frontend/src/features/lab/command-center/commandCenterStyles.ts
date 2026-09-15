/**
 * Command center shared layout, surface, and tone styles.
 */

import { PANEL_VARIANTS } from '@/components/surfaces/Panel';

export type CommandCenterKpiTone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral';

export type CommandCenterTextTone = 'default' | 'success' | 'warning' | 'danger';

export const COMMAND_CENTER_TEXT = {
  panelTitle: 'text-text-primary',
  panelMeta: 'text-text-tertiary',
  sectionTitle: 'text-text-tertiary',
  sectionAside: 'text-text-tertiary',
  summary: 'text-text-tertiary',
  label: 'text-text-primary',
  value: 'text-text-primary',
  detail: 'text-text-tertiary',
  centerLabel: 'text-text-primary',
  centerDetail: 'text-text-tertiary',
  empty: 'text-text-tertiary',
} as const;

export const COMMAND_CENTER_TEXT_TONE: Record<CommandCenterTextTone, string> = {
  default: COMMAND_CENTER_TEXT.value,
  success: 'text-success-fg-emphasis',
  warning: 'text-warning-fg-emphasis',
  danger: 'text-danger-fg-emphasis',
};

export function resolveCommandCenterTextTone(
  tone: CommandCenterTextTone = 'default',
  active = true,
): string {
  if (!active || tone === 'default') return COMMAND_CENTER_TEXT.value;
  return COMMAND_CENTER_TEXT_TONE[tone];
}

export const COMMAND_CENTER_PANEL = {
  ...PANEL_VARIANTS.page,
  page: 'flex-1 min-h-0 min-w-0 overflow-hidden bg-surface-page p-2',
} as const;

export const COMMAND_CENTER_SECTION = {
  title: `text-[9.5px] font-normal uppercase tracking-normal leading-tight ${COMMAND_CENTER_TEXT.sectionTitle}`,
  summary: `text-xxs leading-snug ${COMMAND_CENTER_TEXT.summary}`,
  aside: `shrink-0 text-[9.5px] tabular-nums ${COMMAND_CENTER_TEXT.sectionAside}`,
  statLabel: `text-[9.5px] font-normal uppercase tracking-normal leading-tight ${COMMAND_CENTER_TEXT.sectionTitle}`,
} as const;

export const COMMAND_CENTER_KPI = {
  tile:
    'group relative flex min-w-0 flex-1 items-center gap-2.5 rounded border border-border-default bg-gradient-to-br from-surface via-surface to-surface-page/80 px-2.5 py-2 transition-all duration-200 hover:border-border-hover hover:shadow-sm',
  tileInteractive: 'cursor-pointer',
  tileLink: 'min-w-0 flex-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30',
  tileWrap: 'min-w-0 flex-1',
  iconWrap: 'flex h-8 w-8 shrink-0 items-center justify-center rounded bg-surface-hover',
  label: 'truncate text-xxs uppercase tracking-wide text-text-tertiary',
  value: 'text-lg font-semibold leading-none tabular-nums',
  context: 'truncate text-xxs font-light leading-none text-text-tertiary tabular-nums',
  ringTrack: 'text-border-subtle',
} as const;

export const COMMAND_CENTER_KPI_TONE_ICON: Record<CommandCenterKpiTone, string> = {
  brand: 'text-brand',
  success: 'text-success-fg-emphasis',
  warning: 'text-warning-fg-emphasis',
  danger: 'text-danger-fg-emphasis',
  neutral: 'text-text-secondary',
};

export const COMMAND_CENTER_KPI_TONE_VALUE: Record<CommandCenterKpiTone, string> = {
  brand: 'text-text-primary',
  success: 'text-success-fg-emphasis',
  warning: 'text-warning-fg-emphasis',
  danger: 'text-danger-fg-emphasis',
  neutral: 'text-text-primary',
};

export const COMMAND_CENTER_KPI_RING_TONE: Record<CommandCenterKpiTone, string> = {
  brand: 'text-brand',
  success: 'text-success-fg',
  warning: 'text-warning-fg',
  danger: 'text-danger-fg',
  neutral: 'text-text-secondary',
};

export const COMMAND_CENTER_AGE_COLORS = {
  fresh: 'fill-brand',
  onTrack: 'fill-info-fg-emphasis',
  warning: 'fill-warning-fg-emphasis',
  critical: 'fill-danger-fg-emphasis',
} as const;

export const COMMAND_CENTER_PRIORITY_COLORS = {
  urgent: 'fill-danger-fg-emphasis',
  high: 'fill-warning-fg-emphasis',
  medium: 'fill-brand',
  low: 'fill-chart-axis',
} as const;

export const COMMAND_CENTER_HEALTH_STYLES = {
  healthy: {
    dot: 'bg-success-fg-emphasis',
    text: 'text-success-fg-emphasis',
  },
  attention: {
    dot: 'bg-warning-fg-emphasis',
    text: 'text-warning-fg-emphasis',
  },
  critical: {
    dot: 'bg-danger-fg-emphasis',
    text: 'text-danger-fg-emphasis',
  },
} as const;

export const COMMAND_CENTER_ATTENTION_ACCENT = {
  problem: 'bg-danger-fg-emphasis',
  neutral: 'bg-warning-fg-emphasis',
} as const;
