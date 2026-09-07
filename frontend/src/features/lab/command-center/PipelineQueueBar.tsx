/**
 * PipelineQueueBar - Workflow shortcuts and live pipeline metrics on one line.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Icon, type IconName } from '@/components';
import { ICONS } from '@/config/icons';
import { getLabTabPath } from '@/features/lab/constants/labTabs';
import type { LabPipelineCounts } from '@/features/lab/hooks/useLabPipelineCounts';
import { WORKFLOW_QUEUES, formatDuration } from './pipeline';
import type { CommandCenterOverview } from './useCommandCenter';

const QUEUE_ICONS: Record<string, IconName> = {
  Collection: ICONS.dataFields.clock,
  Results: ICONS.dataFields.flask,
  Review: ICONS.dataFields.notebook,
};

const COUNT_KEYS: Record<string, keyof LabPipelineCounts> = {
  Collection: 'collection',
  Results: 'entry',
  Review: 'validation',
};

interface QueueChipProps {
  icon: IconName;
  label: string;
  count: number;
  hint?: string;
  variant?: 'default' | 'danger' | 'warning';
  onClick: () => void;
}

function QueueChip({
  icon,
  label,
  count,
  hint,
  variant = 'default',
  onClick,
}: QueueChipProps) {
  const borderClass =
    variant === 'danger'
      ? 'border-danger-stroke bg-danger-bg/15 hover:bg-danger-bg/25'
      : variant === 'warning'
        ? 'border-warning-stroke bg-warning-bg/15 hover:bg-warning-bg/25'
        : 'border-border-default bg-surface hover:bg-surface-hover';

  const labelClass =
    variant === 'danger'
      ? 'text-danger-fg'
      : variant === 'warning'
        ? 'text-warning-fg'
        : 'text-text-secondary';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-colors text-left shrink-0 ${borderClass}`}
    >
      <Icon name={icon} className={`w-3.5 h-3.5 shrink-0 ${variant === 'default' ? 'text-brand' : labelClass}`} />
      <span className={`text-xs ${labelClass}`}>{label}</span>
      <Badge
        variant={count > 0 ? (variant === 'danger' ? 'danger' : variant === 'warning' ? 'warning' : 'primary') : 'default'}
        size="xs"
      >
        {count}
      </Badge>
      {hint && <span className="text-xxs text-text-tertiary tabular-nums">{hint}</span>}
    </button>
  );
}

interface StatProps {
  label: string;
  value: number;
  emphasis?: 'default' | 'success' | 'danger' | 'warning';
}

function Stat({ label, value, emphasis = 'default' }: StatProps) {
  const valueClass =
    emphasis === 'success'
      ? 'text-success-fg'
      : emphasis === 'danger'
        ? 'text-danger-fg'
        : emphasis === 'warning'
          ? 'text-warning-fg'
          : 'text-text-primary';

  return (
    <span className="text-xxs text-text-tertiary whitespace-nowrap">
      <span className={`font-medium tabular-nums ${valueClass}`}>{value}</span> {label}
    </span>
  );
}

export interface PipelineQueueBarProps {
  overview: CommandCenterOverview;
}

export const PipelineQueueBar: React.FC<PipelineQueueBarProps> = ({ overview }) => {
  const navigate = useNavigate();
  const { counts, distribution } = overview;
  const distByName = new Map(distribution.map(d => [d.name, d]));
  const escalationDist = distByName.get('Escalation');
  const escalationCount = escalationDist?.value ?? 0;

  const formatWaitHint = (key: string) => {
    const dist = distByName.get(key);
    if (!dist || dist.value === 0 || dist.avgWaitMs == null) return undefined;
    return formatDuration(dist.avgWaitMs);
  };

  return (
    <div className="shrink-0 border-b border-border-default bg-surface-page">
      <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto">
        {WORKFLOW_QUEUES.map(queue => (
          <QueueChip
            key={queue.stage}
            icon={QUEUE_ICONS[queue.stage]}
            label={queue.shortLabel}
            count={counts[COUNT_KEYS[queue.stage]]}
            hint={formatWaitHint(queue.distributionKey)}
            onClick={() => navigate(getLabTabPath(queue.tab))}
          />
        ))}

        <QueueChip
          icon={ICONS.ui.shieldCheck}
          label="Escalation"
          count={escalationCount}
          hint={formatWaitHint('Escalation')}
          variant={escalationCount > 0 ? 'danger' : 'default'}
          onClick={() => navigate(getLabTabPath('validation'))}
        />

        <QueueChip
          icon={ICONS.actions.alertCircle}
          label="Critical"
          count={overview.criticalCount}
          variant={overview.criticalCount > 0 ? 'danger' : 'default'}
          onClick={() => navigate(getLabTabPath('validation'))}
        />

        {overview.canResolveEscalation && (
          <QueueChip
            icon={ICONS.dataFields.sampleCollection}
            label="Recollect"
            count={overview.recollectionCount}
            variant={overview.recollectionCount > 0 ? 'warning' : 'default'}
            onClick={() => navigate(getLabTabPath('validation'))}
          />
        )}

        {overview.canResolveEscalation && overview.escalationCount > 0 && (
          <QueueChip
            icon={ICONS.ui.shieldCheck}
            label="Pending review"
            count={overview.escalationCount}
            variant="danger"
            onClick={() => navigate(getLabTabPath('validation'))}
          />
        )}

        <div className="flex items-center gap-2 ml-auto shrink-0 pl-2 border-l border-border-default">
          <Stat label="active" value={overview.activeTotal} />
          <span className="text-border-default">·</span>
          <Stat label="validated" value={overview.validatedToday} emphasis="success" />
          <span className="text-border-default">·</span>
          <Stat label="arrived" value={overview.arrivedToday} />
          {overview.urgentHighCount > 0 && (
            <>
              <span className="text-border-default">·</span>
              <Stat label="urgent" value={overview.urgentHighCount} emphasis="danger" />
            </>
          )}
          {overview.staleCount > 0 && (
            <>
              <span className="text-border-default">·</span>
              <Stat label="stale" value={overview.staleCount} emphasis="warning" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
