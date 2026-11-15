/**
 * White-label client-config runtime only (`config/client-config.json` via API).
 *
 * ## Import rules
 * - `@/config` — load, terminology (`t`), feature/workflow flags, branding views.
 * - `@/icons`, `@/strings` (UI copy from `config/ui-strings.json`; `@/copy` re-exports), `@/app/routes`, `@/app/navigation`, `@/theme/panelPresets` — product code.
 * - React: `app/clientConfigContext.ts`, `app/ClientConfigProvider.tsx`.
 *
 * ## Repo files (`config/` — each pair is `*.schema.json` + `*.json`)
 * - Client: `client-config.schema.json`, `client-config.json` → `types.ts` via `npm run codegen:client-config`.
 * - UI strings: `ui-strings.schema.json`, `ui-strings.json` (see `@/strings`).
 */

export type { ClientConfig } from './types';

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
} from './client';

export {
  getEffectiveClientConfig,
  getBrandingPresentation,
  getCompanyName,
  getCompanyFullName,
  getReportPdfMeta,
} from './views';
export type { BrandingPresentationView, BrandingFeatureBullet, TrustIndicatorView } from './views';