/** Receipts, calendars, toasts, errors, and misc typography. */

import { text } from './cva/text';
import { TONE } from './tone';

export const FIELD_ERROR = `${text({ role: 'body' })} ${TONE.danger.fg}` as const;

export const FIELD_ERROR_CAPTION = `${text({ role: 'caption' })} ${TONE.danger.fg}` as const;

export const ERROR_SURFACE_TYPE = {
  title: `${text({ role: 'title-page' })} font-semibold`,
  message: `${text({ role: 'amount' })} text-center text-text-tertiary`,
  code: `${text({ role: 'body' })} font-mono`,
  codeMeta: `${text({ role: 'body' })} opacity-60 mt-space-1`,
  operation: `${text({ role: 'amount' })} opacity-80 mt-space-1`,
} as const;

export const ALERT_SURFACE_TYPE = {
  title: `m-0 ${text({ role: 'amount' })} font-semibold leading-snug`,
  body: `mt-space-1 mb-0 ${text({ role: 'amount' })} leading-snug`,
} as const;

export const FILTER_SECTION_TYPE = {
  heading: `${text({ role: 'body' })} font-semibold text-text-tertiary uppercase tracking-wide`,
  countBadge: `${text({ role: 'caption' })} font-normal`,
} as const;

export const THEME_SWITCH_TYPE = {
  segment: `${text({ role: 'body' })} font-normal leading-none`,
  label: `${text({ role: 'caption' })} font-medium leading-none`,
} as const;

export const PRICE_RANGE_TYPE = {
  value: `${text({ role: 'amount' })} font-normal text-text-tertiary`,
  bound: `${text({ role: 'body', intent: 'muted' })} text-text-disabled`,
} as const;

export const DOCUMENT_TYPE = {
  metaPart: `${text({ role: 'body' })} font-normal tabular-nums`,
  metaRow: `flex flex-wrap items-center gap-x-space-2 gap-y-space-0-5 min-w-0 ${text({ role: 'body', intent: 'muted' })}`,
  detailedPatientName: text({ role: 'amount', intent: 'muted' }),
  detailedPatientMissing: `${text({ role: 'amount', intent: 'muted' })} italic`,
  fieldRow: text({ role: 'body' }),
  panelPatientName: text({ role: 'body' }),
  compactEntityId: `${text({ role: 'body' })} min-w-0 truncate`,
  rowListCompact: `flex justify-between items-start gap-space-2 ${text({ role: 'body' })}`,
  rowListDetailed: `flex justify-between items-start gap-space-2 ${text({ role: 'amount' })} gap-space-3`,
  emptyCompact: `${text({ role: 'body', intent: 'muted' })} italic`,
  emptyDetailed: `${text({ role: 'amount', intent: 'muted' })} italic`,
  totalLabelCompact: `${text({ role: 'section-title' })} font-normal`,
  totalLabelDetailed: `${text({ role: 'section-title' })} font-normal`,
  totalValueCompact: `${text({ role: 'amount' })} text-brand`,
  totalValueDetailed: text({ role: 'title-page' }),
} as const;

export const PRICE_DISPLAY = `${text({ role: 'title-page' })} leading-none` as const;

export const FORM_TAB_TITLE = `${text({ role: 'body' })} font-normal` as const;

export const PREVIEW_HEADER_TYPE = {
  companyName: `${text({ role: 'title-page' })} mb-space-3`,
  reportTitle: `${text({ role: 'title-section' })} mb-space-2`,
} as const;

export const MENU_ITEM_TYPE = `${text({ role: 'amount' })}` as const;

export const CALENDAR_TYPE = {
  weekday: `${text({ role: 'body', intent: 'muted' })} text-center py-space-1`,
  day: text({ role: 'body' }),
  month: text({ role: 'amount' }),
  applyButton: `${text({ role: 'body' })} font-normal`,
} as const;

export const TOAST_TYPE = {
  action: `${text({ role: 'amount' })} text-toast-fg`,
  title: `${text({ role: 'amount' })} font-semibold leading-snug text-toast-fg`,
  subtitle: `${text({ role: 'amount' })} leading-snug text-toast-fg-muted`,
} as const;
