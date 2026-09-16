/**
 * Structured audit lines for lab headers (modals and cards).
 */

import type { ReactNode } from 'react';

export type LabAuditLine =
  | {
      type: 'sample-collected';
      sampleId: number | string;
      collectedAt: string;
      collectedBy?: string;
    }
  | {
      type: 'collection-only';
      collectedAt: string;
      collectedBy?: string;
    }
  | {
      type: 'previous-sample-rejected';
      sampleId: number;
      collectedAt: string;
    }
  | {
      type: 'result-entered';
      enteredAt: string;
      enteredBy?: string;
    }
  | {
      type: 'custom';
      content: ReactNode;
    };

export function compactAuditLines(
  ...lines: Array<LabAuditLine | null | undefined | false>
): LabAuditLine[] {
  return lines.filter((line): line is LabAuditLine => Boolean(line));
}

export interface LabSampleAuditInfo {
  sampleId?: string | number;
  collectedAt?: string;
  collectedBy?: string;
}

export function auditLinesFromSampleInfo(
  sampleInfo?: LabSampleAuditInfo,
  extra?: ReactNode
): LabAuditLine[] {
  return compactAuditLines(
    sampleInfo?.collectedAt
      ? sampleInfo.sampleId != null
        ? {
            type: 'sample-collected',
            sampleId: sampleInfo.sampleId,
            collectedAt: sampleInfo.collectedAt,
            collectedBy: sampleInfo.collectedBy,
          }
        : {
            type: 'collection-only',
            collectedAt: sampleInfo.collectedAt,
            collectedBy: sampleInfo.collectedBy,
          }
      : null,
    extra != null && extra !== false ? { type: 'custom', content: extra } : null
  );
}

interface CollectionAuditSource {
  sampleId?: number;
  collectedAt?: string;
  collectedBy?: string;
  isRecollection?: boolean;
  originalSampleId?: number;
  originalSampleCollectedAt?: string;
}

export function collectionHeaderAudit(sample: CollectionAuditSource): LabAuditLine[] {
  return compactAuditLines(
    sample.collectedAt && sample.sampleId != null
      ? {
          type: 'sample-collected',
          sampleId: sample.sampleId,
          collectedAt: sample.collectedAt,
          collectedBy: sample.collectedBy,
        }
      : null,
    sample.isRecollection &&
      sample.originalSampleId != null &&
      sample.originalSampleCollectedAt
      ? {
          type: 'previous-sample-rejected',
          sampleId: sample.originalSampleId,
          collectedAt: sample.originalSampleCollectedAt,
        }
      : null
  );
}

interface TestAuditSource {
  sampleId?: number;
  collectedAt?: string;
  collectedBy?: string;
  resultEnteredAt?: string;
  enteredBy?: string;
}

export function testHeaderAudit(
  test: TestAuditSource,
  options?: { includeResultEntered?: boolean }
): LabAuditLine[] {
  return compactAuditLines(
    test.collectedAt
      ? test.sampleId != null
        ? {
            type: 'sample-collected',
            sampleId: test.sampleId,
            collectedAt: test.collectedAt,
            collectedBy: test.collectedBy,
          }
        : {
            type: 'collection-only',
            collectedAt: test.collectedAt,
            collectedBy: test.collectedBy,
          }
      : null,
    options?.includeResultEntered && test.resultEnteredAt
      ? {
          type: 'result-entered',
          enteredAt: test.resultEnteredAt,
          enteredBy: test.enteredBy,
        }
      : null
  );
}
