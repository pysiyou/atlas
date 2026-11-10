/**
 * Result entry detail modal — DetailGrid section for test metadata.
 */

import { Icon } from '@/components/primitives';
import { RecordId } from '@/features/shared';
import { DetailGrid } from '../shared/detailModalLayout';
import type { LabModalWorkItem } from '../../types/labQueueChrome';
import { formatStatusBadgeLabel } from '@/utils/statusBadge';
import { IconKeys } from '@/config/icons';
import { FG } from '@/theme/recipes';

export function ResultEntryDetailGrid({
  workItem,
  totalParams,
  filledCount,
  isComplete,
  remainingParams,
  showTurnaroundTime,
  turnaroundTime,
}: {
  workItem: LabModalWorkItem;
  totalParams: number;
  filledCount: number;
  isComplete: boolean;
  remainingParams: number;
  showTurnaroundTime: boolean;
  turnaroundTime?: number;
}) {
  return (
    <DetailGrid
      sections={[
        {
          preset: 'panel.compact.standard', title: 'Test Parameters',
          fields: [
            {
              label: 'Total Parameters',
              value: <span className="font-normal">{totalParams}</span>,
            },
            {
              label: 'Filled',
              value: (
                <span className={isComplete ? 'text-success-fg' : 'text-warning-fg'}>
                  {filledCount}
                </span>
              ),
            },
            {
              label: 'Remaining',
              value: (
                <span className={remainingParams === 0 ? 'text-success-fg' : FG.captionMuted}>
                  {remainingParams}
                </span>
              ),
            },
          ],
        },
        {
          preset: 'panel.compact.standard', title: 'Test Information',
          fields: [
            {
              label: 'Test ID',
              value: (
                <RecordId
                  type="orderTest"
                  value={workItem.orderTestId}
                  emphasis="block"
                  className="text-right"
                />
              ),
            },
            {
              label: 'Test Code',
              value: workItem.testCode ? (
                <RecordId emphasis="block" className="text-right">{workItem.testCode}</RecordId>
              ) : undefined,
            },
            {
              label: 'Sample Type',
              value: workItem.sampleType ? formatStatusBadgeLabel(workItem.sampleType) : undefined,
            },
            {
              label: 'Sample ID',
              value: workItem.sampleId ? (
                <RecordId
                  type="sample"
                  value={workItem.sampleId}
                  emphasis="block"
                  className="text-right"
                />
              ) : undefined,
            },
            {
              label: 'Turnaround Time',
              value: showTurnaroundTime ? (
                <span className="flex items-center gap-space-1">
                  <Icon iconKey={IconKeys.dataFields.time} className="w-3.5 h-3.5" />
                  {turnaroundTime}h
                </span>
              ) : undefined,
            },
          ],
        },
      ]}
    />
  );
}
