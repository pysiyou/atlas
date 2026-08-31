/**
 * AuditHistorySection - Compact audit trail for order/sample detail views.
 */

import React, { useMemo } from 'react';
import { SectionPanel } from '@/components';
import { ActivitiesTimeline } from '@/features/lab/command-center/ActivitiesTimeline';
import { useEntityAuditLogs } from '@/features/lab/hooks/useEntityAuditLogs';

interface AuditHistorySectionProps {
  title?: string;
  className?: string;
  entityType: 'order' | 'sample';
  entityId: number;
  relatedTestIds?: number[];
  relatedSampleIds?: number[];
}

export const AuditHistorySection: React.FC<AuditHistorySectionProps> = ({
  title = 'Activity History',
  className,
  entityType,
  entityId,
  relatedTestIds,
  relatedSampleIds,
}) => {
  const { logs, isLoading, isError, error, refetch } = useEntityAuditLogs({
    entityType,
    entityId,
    relatedTestIds,
    relatedSampleIds,
  });

  const limitedLogs = useMemo(() => logs.slice(0, 20), [logs]);

  if (!isLoading && limitedLogs.length === 0) {
    return null;
  }

  return (
    <SectionPanel title={title} spacing="normal" className={className}>
      <ActivitiesTimeline
        logs={limitedLogs}
        isLoading={isLoading}
        isError={isError}
        error={error instanceof Error ? error : null}
        onRetry={refetch}
        className="max-h-64 overflow-y-auto"
      />
    </SectionPanel>
  );
};
