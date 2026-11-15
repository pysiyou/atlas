/**
 * Public HTTP/API surface — import from `@/lib/api`.
 * DTO types: `@/lib/api/types`. Internal: `env.ts`, raw generated OpenAPI.
 */

export { apiClient } from './client';
export type { ApiError } from './client';

export { authAPI, bindAuthClientHandlers, type LoginResponse, type RefreshResponse } from './auth';

export {
  usersAPI,
  useUserLookup,
  useUsersList,
  type UserLookupResponse,
  type UserDisplayInfo,
} from './users';

export {
  DEFAULT_LIST_PAGE_SIZE,
  LIST_PAGE_SIZE_OPTIONS,
  REFERENCE_DATA_LIMIT,
  WORKFLOW_QUERY_LIMIT,
} from './constants';

export {
  buildPaginatedQueryParams,
  withPaginatedParams,
  type PageParams,
} from './pagination';

export {
  expectArray,
  isApiError,
  isAbortError,
  parseErrorMessage,
  parseErrorResponse,
  parseSuccessResponse,
  toNetworkError,
} from './errors';

export {
  authUserResponseSchema,
  loginTokenResponseSchema,
  operationResponseSchema,
  parseApiResponse,
  paymentResponseSchema,
  refreshTokenResponseSchema,
} from './schemas/responses.schema';