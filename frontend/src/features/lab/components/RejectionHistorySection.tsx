/**
 * RejectionHistorySection - Unified rejection history display for sample and result flows.
 * Supports tabbed navigation when multiple rejection records exist.
 */

import React from 'react';
import { formatDate } from '@/utils';
import { useUserLookup } from '@/lib/api/users.api';
import { Badge, SectionPanel } from '@/components';
import { REJECTION_REASON_CONFIG } from '@/types/enums';
import type { RejectionRecord } from '@/types';
import type { ResultRejectionRecord } from '@/types/order';
import { getResultRejectionType } from '@/types/order';

interface TabNavigationProps {
  count: number;
  activeIndex: number;
  onSelect: (index: number) => void;
}

function TabNavigation({ count, activeIndex, onSelect }: TabNavigationProps) {
  if (count <= 1) return null;

  return (
    <div className="flex gap-1">
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
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
  );
}

function useSortedHistory<T extends { rejectedAt: string }>(history: T[]) {
  return React.useMemo(
    () =>
      [...history].sort(
        (a, b) => new Date(a.rejectedAt).getTime() - new Date(b.rejectedAt).getTime()
      ),
    [history]
  );
}

function useActiveTabIndex(historyLength: number) {
  const [activeIndex, setActiveIndex] = React.useState(Math.max(0, historyLength - 1));

  React.useEffect(() => {
    if (historyLength > 0) {
      setActiveIndex(historyLength - 1);
    }
  }, [historyLength]);

  return [activeIndex, setActiveIndex] as const;
}

interface ResultRecordDisplayProps {
  record: ResultRejectionRecord;
  getUserName: (id: string) => string;
}

function ResultRecordDisplay({ record, getUserName }: ResultRecordDisplayProps) {
  return (
    <div className="space-y-1.5 text-xs">
      <div className="flex items-center">
        <span className="text-text-tertiary w-16 shrink-0">Type</span>
        <Badge variant={getResultRejectionType(record) ?? 'neutral'} size="xs" />
      </div>
      {(record.rejectionReason ?? record.reason) && (
        <div className="flex">
          <span className="text-text-tertiary w-16 shrink-0">Reason</span>
          <span className="text-text-primary">{record.rejectionReason ?? record.reason}</span>
        </div>
      )}
      {(record.notes ?? record.rejectionNotes) && (
        <div className="flex">
          <span className="text-text-tertiary w-16 shrink-0">Notes</span>
          <span className="text-text-primary">{record.notes ?? record.rejectionNotes}</span>
        </div>
      )}
      {record.rejectedBy && (
        <div className="flex">
          <span className="text-text-tertiary w-16 shrink-0">By</span>
          <span className="text-text-primary">{getUserName(record.rejectedBy)}</span>
        </div>
      )}
      {record.rejectedAt && (
        <div className="flex">
          <span className="text-text-tertiary w-16 shrink-0">Date</span>
          <span className="text-text-primary">{formatDate(record.rejectedAt)}</span>
        </div>
      )}
    </div>
  );
}

interface SampleRecordDisplayProps {
  reasons?: string[];
  notes?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  getUserName: (id: string) => string;
}

function SampleRecordDisplay({
  reasons,
  notes,
  rejectedBy,
  rejectedAt,
  getUserName,
}: SampleRecordDisplayProps) {
  const reasonLabels = reasons
    ?.map(r => REJECTION_REASON_CONFIG[r as keyof typeof REJECTION_REASON_CONFIG]?.label || r)
    .join(', ');

  return (
    <div className="space-y-1.5 text-xs">
      {reasonLabels && (
        <div className="flex">
          <span className="text-text-tertiary w-16 shrink-0">Reasons</span>
          <span className="text-text-primary">{reasonLabels}</span>
        </div>
      )}
      {notes && (
        <div className="flex">
          <span className="text-text-tertiary w-16 shrink-0">Notes</span>
          <span className="text-text-primary">{notes}</span>
        </div>
      )}
      {rejectedBy && (
        <div className="flex">
          <span className="text-text-tertiary w-16 shrink-0">By</span>
          <span className="text-text-primary">{getUserName(rejectedBy)}</span>
        </div>
      )}
      {rejectedAt && (
        <div className="flex">
          <span className="text-text-tertiary w-16 shrink-0">Date</span>
          <span className="text-text-primary">{formatDate(rejectedAt)}</span>
        </div>
      )}
    </div>
  );
}

export interface ResultRejectionHistoryProps {
  variant: 'result';
  title: string;
  rejectionHistory: ResultRejectionRecord[];
  getUserName?: (id: string) => string;
  showOnlyLatest?: boolean;
}

export interface SampleRejectionHistoryProps {
  variant: 'sample';
  title: string;
  rejectionHistory?: RejectionRecord[];
  reasons?: string[];
  notes?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  getUserName: (id: string) => string;
}

export type RejectionHistorySectionProps = ResultRejectionHistoryProps | SampleRejectionHistoryProps;

function ResultRejectionHistorySection({
  title,
  rejectionHistory,
  getUserName: getUserNameProp,
  showOnlyLatest = false,
}: Omit<ResultRejectionHistoryProps, 'variant'>) {
  const { getUserName: getUserNameFromHook } = useUserLookup();
  const getUserName = getUserNameProp ?? getUserNameFromHook;
  const sortedHistory = useSortedHistory(rejectionHistory ?? []);
  const [activeIndex, setActiveIndex] = useActiveTabIndex(sortedHistory.length);

  if (!rejectionHistory || rejectionHistory.length === 0) {
    return null;
  }

  if (showOnlyLatest) {
    const latestRecord = sortedHistory[sortedHistory.length - 1];
    return (
      <SectionPanel title={title} spacing="normal">
        <ResultRecordDisplay record={latestRecord} getUserName={getUserName} />
      </SectionPanel>
    );
  }

  const activeRecord = sortedHistory[activeIndex];

  return (
    <SectionPanel
      title={title}
      headerRight={
        <TabNavigation
          count={sortedHistory.length}
          activeIndex={activeIndex}
          onSelect={setActiveIndex}
        />
      }
      spacing="normal"
    >
      <ResultRecordDisplay record={activeRecord} getUserName={getUserName} />
    </SectionPanel>
  );
}

function SampleRejectionHistorySection({
  title,
  rejectionHistory,
  reasons,
  notes,
  rejectedBy,
  rejectedAt,
  getUserName,
}: Omit<SampleRejectionHistoryProps, 'variant'>) {
  const sortedHistory = useSortedHistory(rejectionHistory ?? []);
  const [activeIndex, setActiveIndex] = useActiveTabIndex(sortedHistory.length);

  if (rejectionHistory && rejectionHistory.length > 0) {
    const activeRecord = sortedHistory[activeIndex];

    return (
      <SectionPanel
        title={title}
        headerRight={
          <TabNavigation
            count={sortedHistory.length}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
          />
        }
        spacing="normal"
      >
        <SampleRecordDisplay
          reasons={
            activeRecord.rejectionReasons ??
            (activeRecord.rejectionReason ? [activeRecord.rejectionReason] : undefined)
          }
          notes={activeRecord.rejectionNotes}
          rejectedBy={activeRecord.rejectedBy}
          rejectedAt={activeRecord.rejectedAt}
          getUserName={getUserName}
        />
      </SectionPanel>
    );
  }

  return (
    <SectionPanel title={title} spacing="normal">
      <SampleRecordDisplay
        reasons={reasons}
        notes={notes}
        rejectedBy={rejectedBy}
        rejectedAt={rejectedAt}
        getUserName={getUserName}
      />
    </SectionPanel>
  );
}

export const RejectionHistorySection: React.FC<RejectionHistorySectionProps> = props => {
  if (props.variant === 'result') {
    const { variant: _variant, ...rest } = props;
    return <ResultRejectionHistorySection {...rest} />;
  }

  const { variant: _variant, ...rest } = props;
  return <SampleRejectionHistorySection {...rest} />;
};

interface ResultRejectionBannerProps {
  rejection: ResultRejectionRecord;
  retestNumber: number;
}

export const ResultRejectionBanner: React.FC<ResultRejectionBannerProps> = ({
  rejection,
  retestNumber,
}) => {
  const rt = getResultRejectionType(rejection);
  const typeLabel =
    rt === 'authorize_retest' ? 'Authorize re-test' : rt === 're-test' ? 'Re-test' : 'Re-collect';
  const reason = rejection.rejectionReason ?? rejection.reason;

  return (
    <div className="text-xs text-text-tertiary">
      <span className="font-normal">
        {typeLabel} #{retestNumber}
      </span>
      {reason && <span className="text-text-tertiary"> · {reason}</span>}
    </div>
  );
};
