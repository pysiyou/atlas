/**
 * Configuration Index - Central export for all config
 */

export * from './api';
export * from './routes';
export * from './company';
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
  type ClientConfig,
} from './clientConfig';
export { useClientConfig, useClientConfigReady, ClientConfigProvider } from './ClientConfigContext';
export { getModuleListTitles } from './pageCopy';
export { useModuleListTitles } from './useModuleListTitles';
export {
  getOrderFilterPlaceholders,
  getPatientFilterPlaceholders,
  getPaymentFilterPlaceholders,
  getReportFilterPlaceholders,
  getSharedFilterPlaceholders,
  getLabQueueFilterPlaceholders,
} from './filterPlaceholders';
export {
  FEEDBACK_CATALOG,
  type FeedbackChannel,
  type FeedbackEntry,
  type FeedbackId,
  type FeedbackVariant,
} from '@/types/generated/feedbackCatalog';