/**
 * Command center shared layout, surface, and tone styles.
 */
import { PANEL_VARIANTS } from '@/components/surfaces/Panel';
import { PANEL, RADIUS, TONE, TYPE } from '@/components/theme/recipes';
import type { QueueAgeStats } from './commandCenterModel';

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
  success: TONE.success.fgEmphasis,
  warning: TONE.warning.fgEmphasis,
  danger: TONE.danger.fgEmphasis,
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
  page: 'flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-surface-page',
} as const;

/** Top pipeline / KPI strip — aligned with lab workflow queue shell radius. */
export const COMMAND_CENTER_PIPELINE_STRIP =
  `${PANEL.raisedShadowSm} shrink-0 px-3 py-2` as const;

const COMMAND_CENTER_MICRO_LABEL =
  'font-light uppercase leading-tight tracking-wide text-2xs' as const;

export const COMMAND_CENTER_SECTION = {
  microLabel: COMMAND_CENTER_MICRO_LABEL,
  title: `${COMMAND_CENTER_MICRO_LABEL} text-text-tertiary`,
  summary: `leading-snug ${TYPE.caption}`,
  aside: `shrink-0 tabular-nums ${TYPE.caption}`,
  statLabel: `${COMMAND_CENTER_MICRO_LABEL} text-text-tertiary`,
} as const;

export const COMMAND_CENTER_KPI = {
  tile:
    `group relative flex min-w-0 flex-1 items-center gap-2.5 ${RADIUS.surface} border border-border-default bg-gradient-to-br from-surface via-surface to-surface-page/80 px-2.5 py-2 transition-all duration-200 hover:border-border-hover hover:shadow-sm`,
  tileInteractive: 'cursor-pointer',
  tileLink: `min-w-0 flex-1 ${RADIUS.field} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30`,
  tileWrap: 'min-w-0 flex-1',
  iconWrap: `flex h-8 w-8 shrink-0 items-center justify-center ${RADIUS.field} bg-surface-hover`,
  label: `truncate uppercase tracking-wide ${TYPE.caption}`,
  value: `${TYPE.pageTitle} font-semibold leading-none tabular-nums`,
  context: `truncate font-light leading-none tabular-nums ${TYPE.caption}`,
  ringTrack: 'text-border-subtle',
} as const;

export const COMMAND_CENTER_KPI_TONE_ICON: Record<CommandCenterKpiTone, string> = {
  brand: TONE.brand.fg,
  success: TONE.success.fgEmphasis,
  warning: TONE.warning.fgEmphasis,
  danger: TONE.danger.fgEmphasis,
  neutral: TONE.neutral.fg,
};

export const COMMAND_CENTER_KPI_TONE_VALUE: Record<CommandCenterKpiTone, string> = {
  brand: 'text-text-primary',
  success: TONE.success.fgEmphasis,
  warning: TONE.warning.fgEmphasis,
  danger: TONE.danger.fgEmphasis,
  neutral: 'text-text-primary',
};

export const COMMAND_CENTER_KPI_RING_TONE: Record<CommandCenterKpiTone, string> = {
  brand: TONE.brand.fg,
  success: TONE.success.fg,
  warning: TONE.warning.fg,
  danger: TONE.danger.fg,
  neutral: TONE.neutral.fg,
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
    dot: TONE.success.fill,
    text: TONE.success.fgEmphasis,
  },
  attention: {
    dot: TONE.warning.fill,
    text: TONE.warning.fgEmphasis,
  },
  critical: {
    dot: TONE.danger.fill,
    text: TONE.danger.fgEmphasis,
  },
} as const;

export const COMMAND_CENTER_ATTENTION_ACCENT = {
  problem: TONE.danger.fill,
  neutral: TONE.warning.fill,
} as const;

export function queueTileTone(count: number, age: QueueAgeStats): CommandCenterKpiTone {
  if (count === 0) return 'neutral';
  if (age.criticalCount > 0) return 'danger';
  if (age.warningCount > 0) return 'warning';
  return 'brand';
}
