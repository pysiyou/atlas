/**
 * Shared API DTO types aligned with backend OpenAPI schemas.
 */
export type { paths, components, operations } from './generated';

export type {
  ApiPaymentResponse,
  ApiOrderResponse,
  ApiOrderSummaryResponse,
  ApiLatestPaymentSnippet,
  ApiReportableOrderItem,
  ApiSampleResponse,
  ApiOrderableTestResponse,
  ApiOrderableTestSummaryResponse,
  ApiCatalogAnalyteEntry,
  ApiUserLookupResponse,
  ApiLoginTokenResponse,
  ApiRefreshTokenResponse,
  ApiAuthUserResponse,
  ApiMessageResponse,
  ApiQualityIssueOptions,
  ApiQualityIssueResult,
  ApiCriticalValueResponse,
  CollectionWorklistItem,
  DashboardWorklistItem,
  EntryWorklistItem,
  LabPipelineStage,
  LabWorkItemProjection,
  LabWorklistAllowedActions,
  StatusPresentation,
  ValidationWorklistItem,
  WorklistActionGateFields,
  WorklistAttentionFields,
  WorklistPagination,
  WorklistReferentDoctorFields,
} from './schemas';

export type MessageResponse = import('./schemas').ApiMessageResponse;
export type UserLookupResponse = import('./schemas').ApiUserLookupResponse;
export type LoginTokenResponse = Pick<
  import('./schemas').ApiLoginTokenResponse,
  'access_token' | 'refresh_token'
>;
export type RefreshTokenResponse = Pick<
  import('./schemas').ApiRefreshTokenResponse,
  'access_token'
>;
