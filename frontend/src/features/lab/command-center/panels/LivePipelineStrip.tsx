/**
 * Live pipeline queue strip — real-time counts aligned with lab tab badges.
 */

import React from 'react';
import { cn } from '@/utils';
import { ICONS } from '@/config/icons';
import { getLabTabPath } from '../../constants/labTabs';
import { LAB_STAGE_SHORT_ROWS } from '../../constants/labCopy';
import { KpiTile, SectionTitle } from '../LabCommandCenterUi';
import { COMMAND_CENTER_TEXT, resolveCommandCenterTextTone, type CommandCenterKpiTone } from '../commandCenterStyles';
import type { LabCommandCenterSnapshot, QueueAgeStats } from '../boardTypes';
import { queueTileTone } from '../queueTone';
import { LabHealthStatus } from './LabHealthStatus';

function formatOldestAge(age: QueueAgeStats): string {
  if (age.oldestHours === null) return 'No backlog';
  if (age.oldestHours < 1) return 'Oldest <1h';
  return `Oldest ${age.oldestHours}h`;
}

function subtextTone(age: QueueAgeStats): string {
  if (age.criticalCount > 0) return resolveCommandCenterTextTone('danger');
  if (age.warningCount > 0) return resolveCommandCenterTextTone('warning');
  return COMMAND_CENTER_TEXT.detail;
}

function formatValidationSubtext(
  age: QueueAgeStats,
  supervisorCount: number,
): string {
  const oldest = formatOldestAge(age);
  if (supervisorCount <= 0) return oldest;
  return `${oldest} · +${supervisorCount} supervisor`;
}

interface LivePipelineStripProps {
  counts: LabCommandCenterSnapshot['counts'];
  queueAge: LabCommandCenterSnapshot['queueAge'];
  blockers: LabCommandCenterSnapshot['blockers'];
  totalActive: number;
  health: LabCommandCenterSnapshot['health'];
  healthMessage: string;
  suggestedTab: LabCommandCenterSnapshot['suggestedTab'];
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastRefreshedAt?: Date | null;
}

export const LivePipelineStrip: React.FC<LivePipelineStripProps> = ({
  counts,
  queueAge,
  blockers,
  totalActive,
  health,
  healthMessage,
  suggestedTab,
  onRefresh,
  isRefreshing = false,
  lastRefreshedAt = null,
}) => {
  const share = (count: number) =>
    totalActive > 0 ? Math.round((count / totalActive) * 100) : 0;

  const blockedTone: CommandCenterKpiTone = blockers.total > 0 ? 'warning' : 'neutral';

  const stageIcons = {
    collection: ICONS.dataFields.flask,
    entry: ICONS.dataFields.notebook,
    validation: ICONS.ui.shieldCheck,
  } as const;

  const tiles = [
    ...LAB_STAGE_SHORT_ROWS.map(row => ({
      key: row.key,
      icon: stageIcons[row.key],
      label: row.label,
      value: counts[row.key],
      tone: queueTileTone(counts[row.key], queueAge[row.key]),
      to: getLabTabPath(row.key),
      age: queueAge[row.key],
    })),
    {
      key: 'blocked' as const,
      icon: ICONS.actions.alertCircle,
      label: 'Blocked',
      value: blockers.total,
      tone: blockedTone,
      to:
        blockers.paymentUnpaid > 0 || blockers.recollectionWaiting > 0
          ? getLabTabPath('collection')
          : blockers.retestPending > 0
            ? getLabTabPath('entry')
            : undefined,
      age: null as QueueAgeStats | null,
      blockedDetail:
        blockers.total > 0
          ? [
              blockers.paymentUnpaid > 0 ? `${blockers.paymentUnpaid} unpaid` : null,
              blockers.retestPending > 0 ? `${blockers.retestPending} retest` : null,
              blockers.recollectionWaiting > 0 ? `${blockers.recollectionWaiting} recollect` : null,
            ]
              .filter(Boolean)
              .join(' · ')
          : 'None blocked',
    },
  ] as const;

  return (
    <div className="flex shrink-0 flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <SectionTitle title="Live Pipeline" className="shrink-0" />
        <LabHealthStatus
          health={health}
          message={healthMessage}
          suggestedTab={suggestedTab}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          lastRefreshedAt={lastRefreshedAt}
        />
      </div>
      <div className="flex gap-2">
        {tiles.map(tile => (
          <div key={tile.key} className="min-w-0 flex-1">
            <KpiTile
              icon={tile.icon}
              label={tile.label}
              value={tile.value}
              denominator={totalActive || 1}
              ringValue={share(tile.value)}
              tone={tile.tone}
              to={tile.to}
            />
            <p
              className={cn(
                'mt-0.5 truncate px-1 text-[9px] tabular-nums',
                tile.age ? subtextTone(tile.age) : COMMAND_CENTER_TEXT.detail,
              )}
            >
              {'blockedDetail' in tile && tile.blockedDetail
                ? tile.blockedDetail
                : tile.age
                  ? tile.key === 'validation'
                    ? formatValidationSubtext(tile.age, counts.supervisor)
                    : formatOldestAge(tile.age)
                  : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
