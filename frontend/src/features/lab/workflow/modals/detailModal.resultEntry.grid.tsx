/**
 * Result entry detail modal — DetailGrid section for test metadata.
 */

import { Icon } from '@/components/primitives';
import { RecordId } from '@/features/shared';
import { DetailGrid } from '../shared/detailModalLayout';
import type { TestWithContext } from '@/types';
import { formatStatusBadgeLabel } from '@/utils/statusBadge';
import { ICONS } from '@/config/icons';
import { FG } from '@/theme/recipes';

export function ResultEntryDetailGrid({
  test,
  totalParams,
  filledCount,
  isComplete,
  remainingParams,
  showTurnaroundTime,
  turnaroundTime,
}: {
  test: TestWithContext;
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
              value:
                test.id != null ? (
                  <RecordId type="orderTest" value={test.id} emphasis="block" className="text-right" />
                ) : undefined,
            },
            {
              label: 'Test Code',
              value: test.testCode ? (
                <RecordId emphasis="block" className="text-right">{test.testCode}</RecordId>
              ) : undefined,
            },
            {
              label: 'Sample Type',
              value: test.sampleType ? formatStatusBadgeLabel(test.sampleType) : undefined,
            },
            {
              label: 'Sample ID',
              value: test.sampleId ? (
                <RecordId type="sample" value={test.sampleId} emphasis="block" className="text-right" />
              ) : undefined,
            },
            {
              label: 'Turnaround Time',
              value: showTurnaroundTime ? (
                <span className="flex items-center gap-space-1">
                  <Icon name={ICONS.dataFields.time} className="w-3.5 h-3.5" />
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
