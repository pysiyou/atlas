/**
 * White-label client-config runtime only (`config/client-config.json` via API).
 *
 * ## Import rules
 * - `@/config` — load, terminology (`t`), feature/workflow flags, branding views.
 * - `@/icons`, `@/copy`, `@/app/routes`, `@/app/navigation`, `@/theme/panelPresets` — product code.
 * - React: `app/clientConfigContext.ts`, `app/ClientConfigProvider.tsx`.
 *
 * ## Repo files (see `config/README.md`)
 * - Schema: `config/client-config.schema.json` → `types.ts` via `npm run codegen:client-config`.
 * - Fallback: `config/client-config.minimal.json` only (no TS defaults).
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