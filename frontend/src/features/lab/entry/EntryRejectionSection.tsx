/**
 * EntryRejectionSection - Rejection history display section for result entry
 *
 * Displays result rejection history with simple, professional layout.
 * Uses useUsers hook internally for user name resolution.
 */

import React from 'react';
import { formatDate } from '@/utils';
import { useUserLookup } from '@/hooks/queries';
import { Badge, SectionContainer } from '@/shared/ui';
import type { ResultRejectionRecord } from '@/types';

/**
 * Props for a single rejection record display
 */
interface ResultRejectionRecordDisplayProps {
  /** The rejection record to display */
  record: ResultRejectionRecord;
  /** Function to resolve user ID to display name */
  getUserName: (id: string) => string;
}

/**
 * Single rejection record display component
 * Simple text-based layout with badge for type
 */
const RejectionRecordDisplay: React.FC<ResultRejectionRecordDisplayProps> = ({
  record,
  getUserName,
}) => {
  return (
    <div className="space-y-1.5 text-xs">
      {/* Type - displayed as badge */}
      <div className="flex items-center">
        <span className="text-text-tertiary w-16 shrink-0">Type</span>
        <Badge variant={record.rejectionType} size="xs" />
      </div>

      {/* Reason */}
      {record.rejectionReason && (
        <div className="flex">
          <span className="text-text-tertiary w-16 shrink-0">Reason</span>
          <span className="text-text-primary">{record.rejectionReason}</span>
        </div>
      )}

      {/* Rejected by */}
      {record.rejectedBy && (
        <div className="flex">
          <span className="text-text-tertiary w-16 shrink-0">By</span>
          <span className="text-text-primary">{getUserName(record.rejectedBy)}</span>
        </div>
      )}

      {/* Date */}
      {record.rejectedAt && (
        <div className="flex">
          <span className="text-text-tertiary w-16 shrink-0">Date</span>
          <span className="text-text-primary">{formatDate(record.rejectedAt)}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Props for the EntryRejectionSection component
 */
interface EntryRejectionSectionProps {
  /** Section title */
  title: string;
  /** Array of rejection records */
  rejectionHistory: ResultRejectionRecord[];
  /**
   * Optional function to resolve user ID to display name.
   * If not provided, uses useUsers hook internally.
   * @deprecated Pass this prop only for backward compatibility. Will be removed in future.
   */
  getUserName?: (id: string) => string;
  /** Whether to show only the most recent rejection (default: false - show all) */
  showOnlyLatest?: boolean;
}

/**
 * EntryRejectionSection - Component for displaying result rejection history
 *
 * Simple, professional layout showing rejection details.
 * Uses useUsers hook internally for user name resolution.
 */
export const EntryRejectionSection: React.FC<EntryRejectionSectionProps> = ({
  title,
  rejectionHistory,
  getUserName: getUserNameProp,
  showOnlyLatest = false,
}) => {
  const { getUserName: getUserNameFromHook } = useUserLookup();
  const getUserName = getUserNameProp || getUserNameFromHook;

  // Sort by date (oldest first for chronological tab numbering)
  const sortedHistory = React.useMemo(
    () =>
      [...(rejectionHistory || [])].sort(
        (a, b) => new Date(a.rejectedAt).getTime() - new Date(b.rejectedAt).getTime()
      ),
    [rejectionHistory]
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
      <SectionContainer title={title} spacing="normal">
        <RejectionRecordDisplay record={latestRecord} getUserName={getUserName} />
      </SectionContainer>
    );
  }

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
                ? 'bg-neutral-200 text-text-primary font-normal'
                : 'text-text-tertiary hover:bg-neutral-100'
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    ) : null;

  return (
    <SectionContainer title={title} headerRight={TabNavigation} spacing="normal">
      <RejectionRecordDisplay record={activeRecord} getUserName={getUserName} />
    </SectionContainer>
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
  const typeLabel =
    rejection.rejectionType === 'authorize_retest'
      ? 'Authorize re-test'
      : rejection.rejectionType === 're-test'
        ? 'Re-test'
        : 'Re-collect';

  return (
    <div className="text-xs text-text-tertiary">
      <span className="font-normal">
        {typeLabel} #{retestNumber}
      </span>
      {rejection.rejectionReason && (
        <span className="text-text-tertiary"> · {rejection.rejectionReason}</span>
      )}
    </div>
  );
};
