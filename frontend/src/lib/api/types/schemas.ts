/**
 * OpenAPI schema type aliases — single import surface for generated DTOs.
 */
import type { components } from './generated';

type Schemas = components['schemas'];

export type ApiPaymentResponse = Schemas['PaymentResponse'];
export type ApiOrderResponse = Schemas['OrderResponse'];
export type ApiSampleResponse = Schemas['SampleResponse'];
export type ApiTestResponse = Schemas['TestResponse'];
export type ApiTimelineEvent = Schemas['TimelineEvent'];
export type ApiTimelineEventResponse = Schemas['TimelineEventResponse'];
export type ApiTimelineResponse = Schemas['TimelineResponse'];
export type ApiEntityTimelineResponse = Schemas['EntityTimelineResponse'];
export type ApiUserLookupResponse = Schemas['UserLookupResponse'];
export type ApiLoginTokenResponse = Schemas['Token'];
export type ApiRefreshTokenResponse = Schemas['RefreshResponse'];
export type ApiAuthUserResponse = Schemas['UserResponse'];
export type ApiMessageResponse = Schemas['MessageResponse'];
export type ApiQualityIssueOptions = Schemas['QualityIssueOptions'];
export type ApiQualityIssueResult = Schemas['QualityIssueResult'];
export type ApiQualityIssueResponse = Schemas['QualityIssueResponse'];
export type ApiRecollectionRequestSummary = Schemas['RecollectionRequestSummary'];
export type ApiRecollectionRequestResult = Schemas['RecollectionRequestResult'];
export type ApiCriticalValueResponse = Schemas['CriticalValueResponse'];
export type ApiEscalationResolveResponse = Schemas['EscalationResolveResponse'];
