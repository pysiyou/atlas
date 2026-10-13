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
      type: 'recollection-lineage';
      sampleId: number;
      collectedAt?: string;
    }
  | {
      type: 'retest-lineage';
      orderTestId: number;
    }
  | {
      type: 'test-recollection-lineage';
      sampleId: number;
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

export interface SampleCollectionTimelineSource {
  collectedAt?: string;
  collectedBy?: string;
  isRecollection?: boolean;
  originalSampleId?: number;
  originalSampleCollectedAt?: string;
}

/** Sample collection card/modal timeline (line 4): lineage first, then current collection. */
export function buildSampleCollectionTimelineLines(
  sample: SampleCollectionTimelineSource
): LabAuditLine[] {
  return compactAuditLines(
    sample.isRecollection && sample.originalSampleId != null
      ? {
          type: 'recollection-lineage',
          sampleId: sample.originalSampleId,
          collectedAt: sample.originalSampleCollectedAt,
        }
      : null,
    sample.collectedAt
      ? {
          type: 'collection-only',
          collectedAt: sample.collectedAt,
          collectedBy: sample.collectedBy,
        }
      : null
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

/** @deprecated Prefer buildSampleCollectionTimelineLines for sample collection headers. */
export function collectionHeaderAudit(
  sample: CollectionAuditSource,
  options?: { omitSampleId?: boolean }
): LabAuditLine[] {
  if (options?.omitSampleId) {
    return buildSampleCollectionTimelineLines(sample);
  }
  return compactAuditLines(
    sample.collectedAt
      ? sample.sampleId == null
        ? {
            type: 'collection-only',
            collectedAt: sample.collectedAt,
            collectedBy: sample.collectedBy,
          }
        : {
            type: 'sample-collected',
            sampleId: sample.sampleId,
            collectedAt: sample.collectedAt,
            collectedBy: sample.collectedBy,
          }
      : null,
    sample.isRecollection && sample.originalSampleId != null
      ? {
          type: 'recollection-lineage',
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

export interface TestQueueTimelineSource {
  collectedAt?: string;
  collectedBy?: string;
  resultEnteredAt?: string;
  enteredBy?: string;
  retestOfTestId?: number | null;
  sampleOriginalSampleId?: number | null;
}

/** Test workflow queue cards — lineage, collection, result entry (no duplicate TST/SAM in prose). */
export function buildTestQueueTimelineLines(
  source: TestQueueTimelineSource,
  options?: { includeResultEntered?: boolean }
): LabAuditLine[] {
  return compactAuditLines(
    source.retestOfTestId != null
      ? { type: 'retest-lineage', orderTestId: source.retestOfTestId }
      : null,
    source.sampleOriginalSampleId != null
      ? { type: 'test-recollection-lineage', sampleId: source.sampleOriginalSampleId }
      : null,
    source.collectedAt
      ? {
          type: 'collection-only',
          collectedAt: source.collectedAt,
          collectedBy: source.collectedBy,
        }
      : null,
    options?.includeResultEntered && source.resultEnteredAt
      ? {
          type: 'result-entered',
          enteredAt: source.resultEnteredAt,
          enteredBy: source.enteredBy,
        }
      : null
  );
}

export function testHeaderAudit(
  test: TestAuditSource,
  options?: { includeResultEntered?: boolean; omitSampleId?: boolean }
): LabAuditLine[] {
  if (options?.omitSampleId) {
    return buildTestQueueTimelineLines(test, {
      includeResultEntered: options.includeResultEntered,
    });
  }
  return compactAuditLines(
    test.collectedAt
      ? test.sampleId == null
        ? {
            type: 'collection-only',
            collectedAt: test.collectedAt,
            collectedBy: test.collectedBy,
          }
        : {
            type: 'sample-collected',
            sampleId: test.sampleId,
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
