/**
 * OpenAPI schema type aliases — single import surface for generated DTOs.
 */
import type { components } from './generated';

type Schemas = components['schemas'];

export type ApiPaymentResponse = Schemas['PaymentResponse'];
export type ApiOrderResponse = Schemas['OrderResponse'];
export type ApiOrderSummaryResponse = Schemas['OrderSummaryResponse'];
export type ApiLatestPaymentSnippet = Schemas['LatestPaymentSnippet'];
export type ApiReportableOrderItem = Schemas['ReportableOrderItem'];
export type ApiSampleResponse = Schemas['SampleResponse'];
export type ApiOrderableTestResponse = Schemas['OrderableTestResponse'];
export type ApiOrderableTestSummaryResponse = Schemas['OrderableTestSummaryResponse'];
export type ApiCatalogAnalyteEntry = Schemas['CatalogAnalyteEntry'];
export type ApiUserLookupResponse = Schemas['UserLookupResponse'];
export type ApiLoginTokenResponse = Schemas['Token'];
export type ApiRefreshTokenResponse = Schemas['RefreshResponse'];
export type ApiAuthUserResponse = Schemas['UserResponse'];
export type ApiMessageResponse = Schemas['MessageResponse'];
export type ApiQualityIssueOptions = Schemas['QualityIssueOptions'];
export type ApiQualityIssueResult = Schemas['QualityIssueResult'];
export type ApiCriticalValueResponse = Schemas['CriticalValueResponse'];

// Lab worklists and projections (OpenAPI)
export type CollectionWorklistItem = Schemas['CollectionWorklistItem'];
export type EntryWorklistItem = Schemas['EntryWorklistItem'];
export type ValidationWorklistItem = Schemas['ValidationWorklistItem'];
export type DashboardWorklistItem = Schemas['DashboardWorklistItem'];
export type WorklistPagination = Schemas['WorklistPagination'];
export type LabWorklistAllowedActions = Schemas['LabWorklistAllowedActions'];
export type StatusPresentation = Schemas['StatusPresentation'];
export type LabWorkItemProjection = Schemas['LabWorkItemProjection'];

export type LabPipelineStage = NonNullable<CollectionWorklistItem['pipelineStage']>;

export type WorklistReferentDoctorFields = Pick<
  CollectionWorklistItem,
  | 'referentDoctorId'
  | 'referentDoctorName'
  | 'referentDoctorEmail'
  | 'referentDoctorPhone'
  | 'referentDoctorHospital'
  | 'referentDoctorUsername'
>;

export type WorklistAttentionFields = Pick<
  CollectionWorklistItem,
  'attentionReason' | 'attentionLabel'
>;

export type WorklistActionGateFields = Pick<
  CollectionWorklistItem,
  'pipelineStage' | 'allowedActions' | 'denyReason' | 'denyMessage' | 'statusPresentation'
>;
