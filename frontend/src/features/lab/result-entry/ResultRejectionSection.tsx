/**
 * ResultRejectionSection - Rejection history display section for result validation
 * 
 * Displays result rejection history with details about each rejection event.
 * Similar to SampleRejectionSection but for result validation flow.
 */

import React from 'react';
import { formatDate } from '@/utils';
import { DetailSection } from '../shared/LabDetailModal';
import type { ResultRejectionRecord } from '@/types';

/**
 * Props for a single rejection record display
 */
interface ResultRejectionRecordDisplayProps {
  /** The rejection record to display */
  record: ResultRejectionRecord;
  /** Function to resolve user ID to display name */
  getUserName: (id: string) => string;
  /** Visual variant - red for most recent, yellow for history */
  variant?: 'red' | 'yellow';
}

/**
 * Single rejection record display component
 */
const RejectionRecordDisplay: React.FC<ResultRejectionRecordDisplayProps> = ({
  record,
  getUserName,
  variant = 'yellow',
}) => {
  const bulletColor = variant === 'red' ? 'bg-red-500' : 'bg-yellow-500';
  const textColor = variant === 'red' ? 'text-red-700' : 'text-yellow-700';
  const notesColor = variant === 'red' ? 'text-red-600' : 'text-yellow-600';

  // Map rejection type to display label
  const rejectionTypeLabel = record.rejectionType === 're-test' 
    ? 'Re-test (same sample)' 
    : 'Re-collect (new sample)';

  return (
    <ul className="space-y-1">
      <li className={`flex items-center text-xs ${textColor}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${bulletColor} mr-2`} />
        <span className="font-medium">{rejectionTypeLabel}</span>
      </li>
      {record.rejectionReason && (
        <li className={`flex items-center text-xs ${notesColor} italic`}>
          <span className={`w-1.5 h-1.5 rounded-full ${bulletColor} mr-2`} />
          "{record.rejectionReason}"
        </li>
      )}
      <li className="flex items-center text-xs text-gray-600">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2" />
        <span>{getUserName(record.rejectedBy)} · {formatDate(record.rejectedAt)}</span>
      </li>
    </ul>
  );
};

/**
 * Props for the ResultRejectionSection component
 */
interface ResultRejectionSectionProps {
  /** Section title */
  title: string;
  /** Array of rejection records */
  rejectionHistory: ResultRejectionRecord[];
  /** Function to resolve user ID to display name */
  getUserName: (id: string) => string;
  /** Whether to show only the most recent rejection (default: false - show all) */
  showOnlyLatest?: boolean;
}

/**
 * ResultRejectionSection - Component for displaying result rejection history
 * 
 * Shows rejection events from result validation with:
 * - Rejection type (re-test or re-collect)
 * - Rejection reason/notes
 * - Who rejected and when
 */
export const ResultRejectionSection: React.FC<ResultRejectionSectionProps> = ({
  title,
  rejectionHistory,
  getUserName,
  showOnlyLatest = false,
}) => {
  if (!rejectionHistory || rejectionHistory.length === 0) {
    return null;
  }

  // Sort by date (newest first) for display
  const sortedHistory = [...rejectionHistory].sort((a, b) => 
    new Date(b.rejectedAt).getTime() - new Date(a.rejectedAt).getTime()
  );

  const recordsToShow = showOnlyLatest ? [sortedHistory[0]] : sortedHistory;

  return (
    <DetailSection title={title}>
      <div className="space-y-3">
        {recordsToShow.map((record, index) => (
          <RejectionRecordDisplay
            key={`${record.rejectedAt}-${index}`}
            record={record}
            getUserName={getUserName}
            variant={index === 0 ? 'red' : 'yellow'}
          />
        ))}
      </div>
    </DetailSection>
  );
};

/**
 * Compact version of ResultRejectionSection for use in cards
 * Shows only the most recent rejection with minimal styling
 */
interface ResultRejectionBannerProps {
  /** The most recent rejection record */
  rejection: ResultRejectionRecord;
  /** Retest number (1, 2, 3, etc.) */
  retestNumber: number;
}

export const ResultRejectionBanner: React.FC<ResultRejectionBannerProps> = ({
  rejection,
  retestNumber,
}) => {
  const typeLabel = rejection.rejectionType === 're-test' ? 'Re-test' : 'Re-collect';

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
      <p className="font-medium text-xs text-yellow-800">
        {typeLabel} #{retestNumber}
      </p>
      {rejection.rejectionReason && (
        <p className="text-xxs text-yellow-700 mt-0.5 leading-tight">
          Reason: {rejection.rejectionReason}
        </p>
      )}
    </div>
  );
};
