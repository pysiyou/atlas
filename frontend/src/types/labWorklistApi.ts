/**
 * Lab worklist DTOs sourced from OpenAPI (FastAPI → codegen).
 * After backend schema changes: `npm run codegen` from the repo root.
 */
import type { components } from '@/lib/api/types/generated/api';

export type CollectionWorklistItem = components['schemas']['CollectionWorklistItem'];
export type EntryWorklistItem = components['schemas']['EntryWorklistItem'];
export type ValidationWorklistItem = components['schemas']['ValidationWorklistItem'];
export type DashboardWorklistItem = components['schemas']['DashboardWorklistItem'];
export type WorklistPagination = components['schemas']['WorklistPagination'];
export type LabWorklistAllowedActions = components['schemas']['LabWorklistAllowedActions'];

/** Pipeline stage wire values on worklist rows (same union as OpenAPI `pipelineStage`). */
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
