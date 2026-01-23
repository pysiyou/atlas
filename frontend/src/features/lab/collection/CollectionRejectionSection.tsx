/**
 * CollectionRejectionSection - Rejection history display section with tabs
 *
 * Displays sample rejection history with simple, professional layout.
 * Similar to EntryRejectionSection style.
 */

import React from 'react';
import { REJECTION_REASON_CONFIG } from '@/types/enums/rejection-reason';
import { formatDate } from '@/utils';
import { SectionContainer } from '@/shared/ui';
import type { RejectionRecord } from '@/types';

/**
 * Props for single rejection record display
 */
interface RejectionRecordDisplayProps {
  /** Rejection reason codes */
  reasons?: string[];
  /** Additional notes */
  notes?: string;
  /** User ID who rejected */
  rejectedBy?: string;
  /** Timestamp of rejection */
  rejectedAt?: string;
  /** Function to resolve user ID to display name */
  getUserName: (id: string) => string;
}

/**
 * Single rejection record display component
 * Simple text-based layout
 */
const RejectionRecordDisplay: React.FC<RejectionRecordDisplayProps> = ({
  reasons,
  notes,
  rejectedBy,
  rejectedAt,
  getUserName,
}) => {
  // Format reasons to readable labels
  const reasonLabels = reasons
    ?.map(r => REJECTION_REASON_CONFIG[r as keyof typeof REJECTION_REASON_CONFIG]?.label || r)
    .join(', ');

  return (
    <div className="space-y-1.5 text-xs">
      {/* Reasons */}
      {reasonLabels && (
        <div className="flex">
          <span className="text-gray-500 w-16 shrink-0">Reasons</span>
          <span className="text-gray-900">{reasonLabels}</span>
        </div>
      )}

      {/* Notes */}
      {notes && (
        <div className="flex">
          <span className="text-gray-500 w-16 shrink-0">Notes</span>
          <span className="text-gray-900">{notes}</span>
        </div>
      )}

      {/* Rejected by */}
      {rejectedBy && (
        <div className="flex">
          <span className="text-gray-500 w-16 shrink-0">By</span>
          <span className="text-gray-900">{getUserName(rejectedBy)}</span>
        </div>
      )}

      {/* Date */}
      {rejectedAt && (
        <div className="flex">
          <span className="text-gray-500 w-16 shrink-0">Date</span>
          <span className="text-gray-900">{formatDate(rejectedAt)}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Props for single rejection display (backwards compatible)
 */
interface SingleRejectionProps {
  /** Section title */
  title: string;
  /** Rejection reason codes */
  reasons?: string[];
  /** Additional notes */
  notes?: string;
  /** User ID who rejected */
  rejectedBy?: string;
  /** Timestamp of rejection */
  rejectedAt?: string;
  /** Function to resolve user ID to display name */
  getUserName: (id: string) => string;
  /** Rejection history array - when provided, shows tabs for each rejection */
  rejectionHistory?: RejectionRecord[];
}

/**
 * CollectionRejectionSection - Component for displaying sample rejection history
 *
 * Simple, professional layout showing rejection details.
 * Supports two modes:
 * 1. Single rejection: Pass individual props (reasons, notes, etc.)
 * 2. Multiple rejections with tabs: Pass rejectionHistory array
 */
export const CollectionRejectionSection: React.FC<SingleRejectionProps> = ({
  title,
  reasons,
  notes,
  rejectedBy,
  rejectedAt,
  getUserName,
  rejectionHistory,
}) => {
  // Sort rejection history by date (oldest first for chronological tab numbering)
  const sortedHistory = React.useMemo(() => {
    if (!rejectionHistory || rejectionHistory.length === 0) return [];
    return [...rejectionHistory].sort(
      (a, b) => new Date(a.rejectedAt).getTime() - new Date(b.rejectedAt).getTime()
    );
  }, [rejectionHistory]);

  // Default to showing the most recent (last) attempt
  const [activeIndex, setActiveIndex] = React.useState(sortedHistory.length - 1);

  // Update active index when history changes
  React.useEffect(() => {
    if (sortedHistory.length > 0) {
      setActiveIndex(sortedHistory.length - 1);
    }
  }, [sortedHistory.length]);

  // Mode 1: Multiple rejections with tabs
  if (rejectionHistory && rejectionHistory.length > 0) {
    const activeRecord = sortedHistory[activeIndex];

    // Simple tab buttons for multiple rejections
    const TabNavigation =
      sortedHistory.length > 1 ? (
        <div className="flex gap-1">
          {sortedHistory.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`px-2 py-0.5 text-xs rounded ${
                activeIndex === index
                  ? 'bg-gray-200 text-gray-800 font-medium'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      ) : null;

    return (
      <SectionContainer title={title} headerRight={TabNavigation} spacing="normal">
        <RejectionRecordDisplay
          reasons={activeRecord.rejectionReasons}
          notes={activeRecord.rejectionNotes}
          rejectedBy={activeRecord.rejectedBy}
          rejectedAt={activeRecord.rejectedAt}
          getUserName={getUserName}
        />
      </SectionContainer>
    );
  }

  // Mode 2: Single rejection (backwards compatible)
  return (
    <SectionContainer title={title} spacing="normal">
      <RejectionRecordDisplay
        reasons={reasons}
        notes={notes}
        rejectedBy={rejectedBy}
        rejectedAt={rejectedAt}
        getUserName={getUserName}
      />
    </SectionContainer>
  );
};
