/** Receipts, calendars, toasts, errors, and misc typography. */

import { TYPE } from './type';
import { TONE } from './tone';

export const FIELD_ERROR = `${TYPE.value} ${TONE.danger.fg}` as const;

export const FIELD_ERROR_CAPTION = `${TYPE.caption} ${TONE.danger.fg}` as const;

export const ERROR_SURFACE_TYPE = {
  title: `${TYPE.pageTitle} font-semibold`,
  message: `${TYPE.amount} text-center text-text-tertiary`,
  code: `${TYPE.value} font-mono`,
  codeMeta: `${TYPE.value} opacity-60 mt-space-1`,
  operation: `${TYPE.amount} opacity-80 mt-space-1`,
} as const;

export const ALERT_SURFACE_TYPE = {
  title: `m-0 ${TYPE.amount} font-semibold leading-snug`,
  body: `mt-space-1 mb-0 ${TYPE.amount} leading-snug`,
} as const;

export const FILTER_SECTION_TYPE = {
  heading: `${TYPE.value} font-semibold text-text-tertiary uppercase tracking-wide`,
  countBadge: `${TYPE.caption} font-normal`,
} as const;

export const THEME_SWITCH_TYPE = {
  segment: `${TYPE.value} font-normal leading-none`,
  label: `${TYPE.caption} font-medium leading-none`,
} as const;

export const PRICE_RANGE_TYPE = {
  value: `${TYPE.amount} font-normal text-text-tertiary`,
  bound: `${TYPE.meta} text-text-disabled`,
} as const;

export const DOCUMENT_TYPE = {
  metaPart: 'font-normal tabular-nums type-body',
  metaRow: `flex flex-wrap items-center gap-x-space-2 gap-y-space-0-5 min-w-0 ${TYPE.meta}`,
  detailedPatientName: `${TYPE.amount} text-text-secondary`,
  detailedPatientMissing: `${TYPE.amount} text-text-tertiary italic`,
  fieldRow: TYPE.value,
  panelPatientName: TYPE.value,
  compactEntityId: `${TYPE.value} min-w-0 truncate`,
  rowListCompact: 'flex justify-between items-start gap-space-2 type-body',
  rowListDetailed: 'flex justify-between items-start gap-space-2 type-amount gap-space-3',
  emptyCompact: `${TYPE.value} text-text-tertiary italic`,
  emptyDetailed: `${TYPE.amount} text-text-tertiary italic`,
  totalLabelCompact: `${TYPE.value} font-normal text-text-secondary uppercase tracking-wider`,
  totalLabelDetailed: `${TYPE.amount} font-normal text-text-secondary uppercase tracking-wider`,
  totalValueCompact: `${TYPE.amount} text-brand`,
  totalValueDetailed: `${TYPE.pageTitle} text-text-primary`,
} as const;

export const PRICE_DISPLAY = `${TYPE.pageTitle} leading-none` as const;

export const FORM_TAB_TITLE = `${TYPE.value} font-normal` as const;

export const PREVIEW_HEADER_TYPE = {
  companyName: `${TYPE.pageTitle} mb-space-3`,
  reportTitle: `${TYPE.detailTitle} mb-space-2`,
} as const;

export const MENU_ITEM_TYPE = 'type-amount' as const;

export const CALENDAR_TYPE = {
  weekday: `${TYPE.meta} text-center py-space-1`,
  day: TYPE.value,
  month: TYPE.amount,
  applyButton: `${TYPE.value} font-normal`,
} as const;

export const TOAST_TYPE = {
  action: 'type-amount text-toast-fg',
  title: 'type-amount font-semibold leading-snug text-toast-fg',
  subtitle: 'type-amount leading-snug text-toast-fg-muted',
} as const;
