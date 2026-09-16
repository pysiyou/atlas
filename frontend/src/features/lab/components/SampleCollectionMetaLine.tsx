/**
 * Sample collection metadata line (who collected, when, sample id).
 */

import React from 'react';
import { LabAuditLineView } from './LabWorkflowHeader';

interface SampleCollectionMetaLineProps {
  sampleId?: string | number;
  collectedAt?: string;
  collectedBy?: string;
  className?: string;
}

export const SampleCollectionMetaLine: React.FC<SampleCollectionMetaLineProps> = ({
  sampleId,
  collectedAt,
  collectedBy,
  className,
}) => {
  if (!collectedAt) return null;

  const line =
    sampleId !== undefined
      ? {
          type: 'sample-collected' as const,
          sampleId,
          collectedAt,
          collectedBy,
        }
      : {
          type: 'collection-only' as const,
          collectedAt,
          collectedBy,
        };

  return <LabAuditLineView line={line} className={className} />;
};
