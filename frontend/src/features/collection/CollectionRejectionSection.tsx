/**
 * CollectionRejectionSection - Re-exports unified rejection history for sample flows.
 */

import React from 'react';
import type { RejectionRecord } from '@/types';
import { RejectionHistorySection } from '@/features/lab/components/RejectionHistorySection';

interface CollectionRejectionSectionProps {
  title: string;
  reasons?: string[];
  notes?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  getUserName: (id: string) => string;
  rejectionHistory?: RejectionRecord[];
}

export const CollectionRejectionSection: React.FC<CollectionRejectionSectionProps> = props => (
  <RejectionHistorySection variant="sample" {...props} />
);
