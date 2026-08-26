/**
 * EntryRejectionSection - Re-exports unified rejection history for result flows.
 */

import React from 'react';
import type { ResultRejectionRecord } from '@/types/order';
import {
  RejectionHistorySection,
  ResultRejectionBanner,
} from '@/features/lab/components/RejectionHistorySection';

interface EntryRejectionSectionProps {
  title: string;
  rejectionHistory: ResultRejectionRecord[];
  getUserName?: (id: string) => string;
  showOnlyLatest?: boolean;
}

export const EntryRejectionSection: React.FC<EntryRejectionSectionProps> = props => (
  <RejectionHistorySection variant="result" {...props} />
);

export { ResultRejectionBanner };
