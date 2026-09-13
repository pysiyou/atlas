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

/** Entity/audit timeline events include phase/tone from OpenAPI TimelineEventResponse */
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

/**
 * Backend endpoints available but not wired in the frontend UI.
 * @see backend/app/api/v1/
 */
export const UNWIRED_BACKEND_ENDPOINTS = [
  'POST /orders/{orderId}/report',
  'POST /results/order-tests/{orderTestId}/request-amendment',
  'GET /critical-values/all',
  'GET /orders/{order_id}/critical-values',
  'GET /audit/logs',
  'GET /audit/logs/count',
  'GET/POST/PUT/DELETE /users (admin CRUD — only /users/lookup is used)',
  'POST /analyzer/hl7',
  'POST /analyzer/json',
  'GET /analyzer/pending/{analyzer_id}',
] as const;
