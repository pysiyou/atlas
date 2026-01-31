/**
 * WorkflowTableCard - Sortable table: Workflow by Stage or Escalations.
 * Uses semantic table + useTableSort; row click opens escalation modal when Escalations mode.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { Card, CardHeader } from '@/shared/ui';
import { displayId } from '@/utils';
import { AttemptCounterBadge } from './AttemptCounterBadge';
import { TATTimerBadge } from './TATTimerBadge';
import type { CommandCenterData } from '../types';
import type { PendingEscalationItem } from '@/types/lab-operations';

const MAX_RETEST_ATTEMPTS = 3;

type TableMode = 'workflow' | 'escalations';

interface WorkflowRow {
  stage: string;
  pending: number;
  other: number;
  otherLabel: string;
}

function buildWorkflowRows(workflow: CommandCenterData['workflow']): WorkflowRow[] {
  return [
    {
      stage: 'Pre-Analytical',
      pending: workflow.preAnalytical.pending,
      other: workflow.preAnalytical.rejected.length,
      otherLabel: 'Rejected',
    },
    {
      stage: 'Analytical',
      pending: workflow.analytical.pending,
      other: workflow.analytical.retestQueue.length,
      otherLabel: 'Retest',
    },
    {
      stage: 'Post-Analytical',
      pending: workflow.postAnalytical.pending,
      other: workflow.postAnalytical.partiallyValidated,
      otherLabel: 'Part. Validated',
    },
  ];
}

type SortKey = 'stage' | 'pending' | 'other';
type SortDir = 'asc' | 'desc';

function sortWorkflowRows(rows: WorkflowRow[], key: SortKey, dir: SortDir): WorkflowRow[] {
  return [...rows].sort((a, b) => {
    const aVal = key === 'stage' ? a.stage : key === 'pending' ? a.pending : a.other;
    const bVal = key === 'stage' ? b.stage : key === 'pending' ? b.pending : b.other;
    const cmp = typeof aVal === 'string' ? (aVal as string).localeCompare(bVal as string) : (aVal as number) - (bVal as number);
    return dir === 'asc' ? cmp : -cmp;
  });
}

export interface WorkflowTableCardProps {
  workflow: CommandCenterData['workflow'];
  escalatedCases: PendingEscalationItem[];
  onEscalatedCaseClick?: (item: PendingEscalationItem) => void;
}

export const WorkflowTableCard: React.FC<WorkflowTableCardProps> = ({
  workflow,
  escalatedCases,
  onEscalatedCaseClick,
}) => {
  const [mode, setMode] = useState<TableMode>('workflow');
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'pending', dir: 'desc' });

  const workflowRows = useMemo(() => buildWorkflowRows(workflow), [workflow]);
  const sortedWorkflowRows = useMemo(
    () => sortWorkflowRows(workflowRows, sort.key, sort.dir),
    [workflowRows, sort]
  );

  const handleSort = useCallback((key: SortKey) => {
    setSort(prev => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const tableAction = (
    <div className="flex items-center gap-1">
      {(['workflow', 'escalations'] as const).map(m => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          className={`px-2 py-1 rounded text-xs font-medium ${
            mode === m
              ? 'bg-action-primary-muted-bg text-action-primary'
              : 'text-text-tertiary hover:bg-surface-hover'
          }`}
        >
          {m === 'workflow' ? 'By Stage' : 'Escalations'}
        </button>
      ))}
    </div>
  );

  return (
    <Card className="rounded-xl flex flex-col overflow-hidden min-w-0 flex-1 min-h-0 h-full" padding="none" variant="default">
      <div className="shrink-0 px-4 pt-4">
        <CardHeader
          title={mode === 'workflow' ? 'Workflow by Stage' : 'Escalations'}
          subtitle={mode === 'escalations' ? `${escalatedCases.length} cases` : undefined}
          action={tableAction}
        />
      </div>
      <div className="flex-1 min-h-0 overflow-auto px-4 pb-4">
        {mode === 'workflow' ? (
          <table className="w-full text-sm" aria-label="Workflow by stage">
            <thead>
              <tr className="border-b border-border-default text-left text-text-tertiary uppercase tracking-wide text-xs">
                <th
                  className="py-3 pr-4 cursor-pointer hover:text-text-secondary"
                  onClick={() => handleSort('stage')}
                >
                  Stage {sort.key === 'stage' && (sort.dir === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="py-3 pr-4 cursor-pointer hover:text-text-secondary"
                  onClick={() => handleSort('pending')}
                >
                  Pending {sort.key === 'pending' && (sort.dir === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="py-3 cursor-pointer hover:text-text-secondary"
                  onClick={() => handleSort('other')}
                >
                  Other {sort.key === 'other' && (sort.dir === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedWorkflowRows.map(row => (
                <tr key={row.stage} className="border-b border-border-subtle">
                  <td className="py-3 pr-4 font-medium text-text-primary">{row.stage}</td>
                  <td className="py-3 pr-4 tabular-nums text-text-secondary">{row.pending}</td>
                  <td className="py-3 tabular-nums text-text-secondary">
                    {row.other} {row.otherLabel}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="space-y-2">
            {escalatedCases.length === 0 ? (
              <p className="text-sm text-text-tertiary py-4">No escalated cases</p>
            ) : (
              escalatedCases.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onEscalatedCaseClick?.(item)}
                  className="w-full text-left rounded border border-border-default bg-surface-default p-3 text-xs hover:border-action-primary hover:bg-action-primary-muted-bg transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-medium text-text-primary truncate">
                      {item.patientName} · {item.testName}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.isRetest && (
                        <AttemptCounterBadge
                          attempt={(item.retestNumber ?? 0) + 1}
                          max={MAX_RETEST_ATTEMPTS}
                        />
                      )}
                      <TATTimerBadge sinceIso={item.resultEnteredAt ?? item.orderDate} />
                    </div>
                  </div>
                  <div className="mt-1 text-xxs text-text-tertiary font-mono">
                    {displayId.order(item.orderId)} · {item.testCode}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
