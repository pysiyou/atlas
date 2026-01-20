/**
 * ResultRejectionSection - Rejection history display section for result validation
 * 
 * Displays result rejection history with tabs for each rejection attempt.
 * Similar to SampleRequirementsSection tab pattern.
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
 * Matches the layout structure of SampleRejectionSection
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
      {/* Rejection type - similar to reasons in SampleRejectionSection */}
      <li className={`flex items-center text-xs ${textColor}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${bulletColor} mr-2`} />
        <span className="font-medium">{rejectionTypeLabel}</span>
      </li>
      {/* Rejection reason/notes - italic style */}
      {record.rejectionReason && (
        <li className={`flex items-center text-xs ${notesColor} italic`}>
          <span className={`w-1.5 h-1.5 rounded-full ${bulletColor} mr-2`} />
          "{record.rejectionReason}"
        </li>
      )}
      {/* Rejected by and timestamp */}
      {record.rejectedBy && record.rejectedAt && (
        <li className="flex items-center text-xs text-gray-600">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2" />
          <span>{getUserName(record.rejectedBy)} · {formatDate(record.rejectedAt)}</span>
        </li>
      )}
      {/* Re-collect indicator - similar to recollectionRequired in SampleRejectionSection */}
      {record.rejectionType === 're-collect' && (
        <li className="flex items-center text-xs text-gray-600">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2" />
          <span>Recollection required</span>
        </li>
      )}
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
 * Shows rejection events from result validation with tabs for each attempt:
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
  // Sort by date (oldest first for chronological tab numbering)
  const sortedHistory = React.useMemo(() => 
    [...(rejectionHistory || [])].sort((a, b) => 
      new Date(a.rejectedAt).getTime() - new Date(b.rejectedAt).getTime()
    ), [rejectionHistory]
  );

  // Default to showing the most recent (last) attempt
  const [activeIndex, setActiveIndex] = React.useState(sortedHistory.length - 1);

  // Update active index when history changes
  React.useEffect(() => {
    setActiveIndex(sortedHistory.length - 1);
  }, [sortedHistory.length]);

  if (!rejectionHistory || rejectionHistory.length === 0) {
    return null;
  }

  // For showOnlyLatest mode, just show the most recent without tabs
  if (showOnlyLatest) {
    const latestRecord = sortedHistory[sortedHistory.length - 1];
    return (
      <DetailSection title={title}>
        <RejectionRecordDisplay
          record={latestRecord}
          getUserName={getUserName}
          variant="red"
        />
      </DetailSection>
    );
  }

  const activeRecord = sortedHistory[activeIndex];
  // Most recent (last in sorted array) gets red variant
  const isLatest = activeIndex === sortedHistory.length - 1;

  return (
    <DetailSection
      title={title}
      headerRight={
        sortedHistory.length > 1 ? (
          <div className="flex gap-1">
            {sortedHistory.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  activeIndex === index
                    ? 'bg-yellow-100 text-yellow-700 font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        ) : undefined
      }
    >
      <RejectionRecordDisplay
        record={activeRecord}
        getUserName={getUserName}
        variant={isLatest ? 'red' : 'yellow'}
      />
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
