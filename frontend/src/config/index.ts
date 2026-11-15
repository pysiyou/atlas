/**
 * White-label client-config runtime only (`config/client-config.json` via API).
 *
 * ## Import rules
 * - `@/config` — client-config load, terminology, flags, branding views.
 * - `@/strings` — UI copy from `config/ui-strings.json`.
 * - `@/icons`, `@/app/routes`, `@/app/navigation`, `@/theme/panelPresets` — other product modules.
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