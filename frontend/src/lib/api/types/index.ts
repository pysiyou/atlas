/**
 * Shared API DTO types aligned with backend OpenAPI schemas.
 */
export type { paths, components, operations } from './generated';

export type {
  ApiPaymentResponse,
  ApiOrderResponse,
  ApiSampleResponse,
  ApiTestResponse,
  ApiTimelineEvent,
  ApiTimelineEventResponse,
  ApiTimelineResponse,
  ApiEntityTimelineResponse,
  ApiUserLookupResponse,
  ApiLoginTokenResponse,
  ApiRefreshTokenResponse,
  ApiAuthUserResponse,
  ApiMessageResponse,
  ApiQualityIssueOptions,
  ApiQualityIssueResult,
  ApiQualityIssueResponse,
  ApiRecollectionRequestSummary,
  ApiRecollectionRequestResult,
  ApiCriticalValueResponse,
  ApiEscalationResolveResponse,
} from './schemas';

/** Entity/audit timeline events include category/tone from OpenAPI TimelineEventResponse */
export type TimelineEvent = import('./schemas').ApiTimelineEventResponse;
export type TimelineResponse = import('./schemas').ApiTimelineResponse;
export type EntityTimelineResponse = import('./schemas').ApiEntityTimelineResponse;
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
