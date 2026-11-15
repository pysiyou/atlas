/**
 * Atlas frontend config — style spec and public barrel.
 *
 * ## Layers (import rules)
 * - `@/config` — routes, API wiring, client config, copy, chrome, panels (this barrel).
 * - `@/config/icons` — icon registry only (large catalog; not re-exported here).
 * - `features/<name>/config/*` — table/filter builders for that feature only.
 * - `@/utils/constants` — generic UI limits (pagination sizes), not terminology copy.
 *
 * ## Naming
 * - Copy helpers: `getModuleListTitles`, `getOrderFilterPlaceholders`, `emptyTitle`.
 * - Route keys: `ROUTES.HOME`, etc. Types: PascalCase (`NavMenuItemDefinition`, `PanelPresetId`).
 * - Sidebar nav: wire definitions in `domain/chrome.ts`; labels via `t()` in layout (`useSidebarMenu`).
 * - Feature config files: `*Table.config.tsx`, `*Filters.config.ts`.
 *
 * ## Domain files (internal; import via `@/config` only — no React)
 * - `domain/client.ts` — load/cache, terminology, company facade.
 * - `domain/copy.ts` — module titles, table headers, filters, empty states.
 * - `domain/chrome.ts` — sidebar nav wire data and motion tokens.
 * - `domain/panels.ts` — panel preset registry.
 * - `static/api.ts`, `static/routes.ts` — env and route constants.
 *
 * ## React (not under `config/`)
 * - `app/clientConfigContext.ts`, `app/ClientConfigProvider.tsx` — loaded config context.
 * - `hooks/useModuleListTitles.ts` — terminology-aware list titles hook.
 * - `components/layout/appChromeMount.tsx` — page header portal target.
 *
 * ## Feature config conventions
 * - Import `@/config` and `@/config/icons`; do not import another feature's `config/`.
 */

// =============================================================================
// static — api
// =============================================================================
export { API_CONFIG } from './static/api';

// =============================================================================
// static — routes
// =============================================================================
export { ROUTES } from './static/routes';
export type { RoutePath } from './static/routes';

// =============================================================================
// client — load and terminology
// =============================================================================
export {
  loadClientConfig,
  getClientConfig,
  t,
  tCap,
  tLower,
  tUpper,
  interpolate,
  getFeedbackTerminologyContext,
  isFeatureEnabled,
  isWorkflowEnabled,
  applyBranding,
  companyConfig,
} from './domain/client';
export type {
  ClientConfig,
  CompanyAddress,
  CompanyContact,
  CompanyBranding,
  CompanyFeature,
  CompanyReports,
  TrustIndicator,
  CompanyMarketing,
  CompanyData,
} from './domain/client';

// =============================================================================
// copy — module titles
// =============================================================================
export { getModuleListTitles } from './domain/copy';

// =============================================================================
// copy — table headers
// =============================================================================
export {
  getOrderTableColumnHeaders,
  getPatientTableColumnHeaders,
  getUrlFilterChipLabels,
} from './domain/copy';
export type { OrderTableColumnHeaders } from './domain/copy';

// =============================================================================
// copy — filter placeholders
// =============================================================================
export {
  getOrderFilterPlaceholders,
  getPatientFilterPlaceholders,
  getPaymentFilterPlaceholders,
  getReportFilterPlaceholders,
  getSharedFilterPlaceholders,
  getLabQueueFilterPlaceholders,
} from './domain/copy';

// =============================================================================
// copy — empty state
// =============================================================================
export { getEmptyCopy, emptySubtitle, emptyTitle } from './domain/copy';
export type { EmptyCopy } from './domain/copy';
export {
  PANEL_EMPTY_STATE,
  DENSE_EMPTY_STATE,
  DENSE_EMPTY_STATE_TEXT,
} from './domain/copy';

// =============================================================================
// chrome — sidebar and mount
// =============================================================================
export {
  SIDEBAR_MOTION,
  NAV_MENU_DEFINITIONS,
  SETTINGS_POPOVER_TRIGGER,
  SETTINGS_POPOVER_LINK_DEFINITIONS,
  getFilteredNavMenuDefinitions,
  getFilteredSettingsPopoverLinkDefinitions,
  getFilteredSettingsItems,
} from './domain/chrome';
export type {
  NavMenuItemDefinition,
  SettingsPopoverLinkDefinition,
  SettingsItem,
} from './domain/chrome';

// =============================================================================
// panels — registry
// =============================================================================
export {
  getPanelPreset,
  PANEL_PRESETS,
  PANEL_BODY_LAYOUT,
  PANEL_SCROLL,
  PANEL_SHELL_LAYOUT,
  PANEL_SPACING,
  layoutPanelPresets,
} from './domain/panels';
export type {
  PanelPresetId,
  PanelPresetDefinition,
  PanelBodyLayout,
  PanelShellLayout,
  PanelScroll,
  PanelSpacing,
  PanelVariant,
} from './domain/panels';