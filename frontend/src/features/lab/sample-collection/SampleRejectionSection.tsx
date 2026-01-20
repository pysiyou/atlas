/**
 * SampleRejectionSection - Rejection history display section with tabs
 * 
 * Displays sample rejection history with tabs for each rejection attempt.
 * Similar to ResultRejectionSection tab pattern.
 */

import React from 'react';
import { REJECTION_REASON_CONFIG } from '@/types/enums/rejection-reason';
import { formatDate } from '@/utils';
import { DetailSection } from '../shared/LabDetailModal';
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
  /** Whether recollection is required */
  recollectionRequired?: boolean;
  /** ID of recollection sample if created */
  recollectionSampleId?: string;
  /** Visual variant - red for current rejection, yellow for history */
  variant?: 'red' | 'yellow';
  /** Function to resolve user ID to display name */
  getUserName: (id: string) => string;
}

/**
 * Single rejection record display component
 */
const RejectionRecordDisplay: React.FC<RejectionRecordDisplayProps> = ({
  reasons,
  notes,
  rejectedBy,
  rejectedAt,
  recollectionRequired,
  recollectionSampleId,
  variant = 'red',
  getUserName,
}) => {
  const bulletColor = variant === 'red' ? 'bg-red-500' : 'bg-yellow-500';
  const textColor = variant === 'red' ? 'text-red-700' : 'text-yellow-700';
  const notesColor = variant === 'red' ? 'text-red-600' : 'text-yellow-600';

  return (
    <ul className="space-y-1">
      {reasons && (
        <li className={`flex items-center text-xs ${textColor}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${bulletColor} mr-2`} />
          <span className="font-medium">
            {reasons.map(r => REJECTION_REASON_CONFIG[r as keyof typeof REJECTION_REASON_CONFIG]?.label || r).join(', ')}
          </span>
        </li>
      )}
      {notes && (
        <li className={`flex items-center text-xs ${notesColor} italic`}>
          <span className={`w-1.5 h-1.5 rounded-full ${bulletColor} mr-2`} />
          "{notes}"
        </li>
      )}
      {rejectedBy && rejectedAt && (
        <li className="flex items-center text-xs text-gray-600">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2" />
          <span>{getUserName(rejectedBy)} · {formatDate(rejectedAt)}</span>
        </li>
      )}
      {recollectionRequired && (
        <li className="flex items-center text-xs text-gray-600">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2" />
          <span>Recollection required</span>
        </li>
      )}
      {recollectionSampleId && (
        <li className="flex items-center text-xs text-gray-600">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2" />
          <span>Recollection sample: <span className="font-mono font-medium">{recollectionSampleId}</span></span>
        </li>
      )}
    </ul>
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
  /** Whether recollection is required */
  recollectionRequired?: boolean;
  /** ID of recollection sample if created */
  recollectionSampleId?: string;
  /** Visual variant - red for current rejection, yellow for history */
  variant?: 'red' | 'yellow';
  /** Function to resolve user ID to display name */
  getUserName: (id: string) => string;
  /** Rejection history array - when provided, shows tabs for each rejection */
  rejectionHistory?: RejectionRecord[];
}

/**
 * SampleRejectionSection - Component for displaying sample rejection history
 * 
 * Supports two modes:
 * 1. Single rejection: Pass individual props (reasons, notes, etc.)
 * 2. Multiple rejections with tabs: Pass rejectionHistory array
 */
export const SampleRejectionSection: React.FC<SingleRejectionProps> = ({
  title,
  reasons,
  notes,
  rejectedBy,
  rejectedAt,
  recollectionRequired,
  recollectionSampleId,
  variant = 'red',
  getUserName,
  rejectionHistory,
}) => {
  // Sort rejection history by date (oldest first for chronological tab numbering)
  const sortedHistory = React.useMemo(() => {
    if (!rejectionHistory || rejectionHistory.length === 0) return [];
    return [...rejectionHistory].sort((a, b) => 
      new Date(a.rejectedAt).getTime() - new Date(b.rejectedAt).getTime()
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
          reasons={activeRecord.rejectionReasons}
          notes={activeRecord.rejectionNotes}
          rejectedBy={activeRecord.rejectedBy}
          rejectedAt={activeRecord.rejectedAt}
          recollectionRequired={activeRecord.recollectionRequired}
          variant={isLatest ? 'red' : 'yellow'}
          getUserName={getUserName}
        />
      </DetailSection>
    );
  }

  // Mode 2: Single rejection (backwards compatible)
  return (
    <DetailSection title={title}>
      <RejectionRecordDisplay
        reasons={reasons}
        notes={notes}
        rejectedBy={rejectedBy}
        rejectedAt={rejectedAt}
        recollectionRequired={recollectionRequired}
        recollectionSampleId={recollectionSampleId}
        variant={variant}
        getUserName={getUserName}
      />
    </DetailSection>
  );
};
