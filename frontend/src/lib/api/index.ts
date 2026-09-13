/**
 * Core API layer — transport client, auth service, error utilities, types.
 */
export { apiClient, type ApiError, type APIError } from './client';
export { authAPI, type LoginResponse, type RefreshResponse } from './auth.service';
export { usersAPI, type UserLookupResponse, type UserDisplayInfo } from './users.service';
export {
  DEFAULT_LIST_PAGE_SIZE,
  REFERENCE_DATA_LIMIT,
  WORKFLOW_QUERY_LIMIT,
  LEGACY_BULK_LIMIT,
} from './constants';
export type {
  TimelineEvent,
  TimelineResponse,
  EntityTimelineResponse,
  OperationResponse,
  MessageResponse,
  LoginTokenResponse,
  RefreshTokenResponse,
  ApiPaymentResponse,
  ApiOrderResponse,
  ApiTestResponse,
  ApiTimelineResponse,
  ApiUserLookupResponse,
  ApiQualityIssueOptions,
  ApiRecollectionRequestSummary,
  ApiCriticalValueResponse,
  ApiEscalationResolveResponse,
} from './types';
export { UNWIRED_BACKEND_ENDPOINTS } from './types';
export {
  isApiError,
  isAbortError,
  parseErrorMessage,
  parseErrorResponse,
  toNetworkError,
} from './errors';
export {
  loginTokenResponseSchema,
  refreshTokenResponseSchema,
  authUserResponseSchema,
  paymentResponseSchema,
  operationResponseSchema,
  timelineResponseSchema,
  parseApiResponse,
} from './schemas/responses.schema';
