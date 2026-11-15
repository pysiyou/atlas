/**
 * Terminology-aware UI strings from config/ui-strings.json + client-config terminology.
 *
 * Import getters from `@/strings`. React hooks live in `./react` and are re-exported here.
 */

export {
  DENSE_EMPTY_STATE,
  DENSE_EMPTY_STATE_TEXT,
  PANEL_EMPTY_STATE,
  emptySubtitle,
  emptyTitle,
  getEmptyCopy,
  getEventLogCopy,
  getLabCopy,
  getLabQueueFilterPlaceholders,
  getModuleListTitles,
  getNavCopy,
  getOrderFilterPlaceholders,
  getOrderTableColumnHeaders,
  getPatientFilterPlaceholders,
  getPatientTableColumnHeaders,
  getPaymentFilterPlaceholders,
  getReportFilterPlaceholders,
  getSharedFilterPlaceholders,
  getUrlFilterChipLabels,
  msg,
  type EmptyCopy,
  type EventLogCopy,
  type ModuleListTitles,
  type NavCopy,
  type NavMainKey,
  type NavSettingsLinkKey,
  type OrderTableColumnHeaders,
} from './catalog';

export { useEventLogCopy, useLabCopy, useModuleListTitles, useNavCopy } from './react';
