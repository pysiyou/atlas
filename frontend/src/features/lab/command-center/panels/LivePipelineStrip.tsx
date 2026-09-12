/**
 * Live pipeline queue strip — real-time counts aligned with lab tab badges.
 */

import React from 'react';
import { cn } from '@/utils';
import { ICONS } from '@/config/icons';
import { getLabTabPath } from '../../constants/labTabs';
import { KpiTile, SectionTitle } from '../components';
import type { CommandCenterKpiTone } from '../components/styles';
import { COMMAND_CENTER_TEXT, resolveCommandCenterTextTone } from '../components/styles';
import type { LabTechBoardData, QueueAgeStats } from '../hooks/useLabTechBoard';
import { LabHealthStatus } from './HealthBanner';

function queueTileTone(count: number, age: QueueAgeStats): CommandCenterKpiTone {
  if (count === 0) return 'neutral';
  if (age.criticalCount > 0) return 'danger';
  if (age.warningCount > 0) return 'warning';
  return 'brand';
}

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

interface LivePipelineStripProps {
  counts: LabTechBoardData['counts'];
  queueAge: LabTechBoardData['queueAge'];
  blockers: LabTechBoardData['blockers'];
  totalActive: number;
  health: LabTechBoardData['health'];
  healthMessage: string;
  suggestedTab: LabTechBoardData['suggestedTab'];
  onRefresh?: () => void;
  isRefreshing?: boolean;
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
}) => {
  const share = (count: number) =>
    totalActive > 0 ? Math.round((count / totalActive) * 100) : 0;

  const blockedTone: CommandCenterKpiTone = blockers.total > 0 ? 'warning' : 'neutral';

  const tiles = [
    {
      key: 'collection',
      icon: ICONS.dataFields.flask,
      label: 'Collection',
      value: counts.collection,
      tone: queueTileTone(counts.collection, queueAge.collection),
      to: getLabTabPath('collection'),
      age: queueAge.collection,
    },
    {
      key: 'entry',
      icon: ICONS.dataFields.notebook,
      label: 'Entry',
      value: counts.entry,
      tone: queueTileTone(counts.entry, queueAge.entry),
      to: getLabTabPath('entry'),
      age: queueAge.entry,
    },
    {
      key: 'validation',
      icon: ICONS.ui.shieldCheck,
      label: 'Review',
      value: counts.validation,
      tone: queueTileTone(counts.validation, queueAge.validation),
      to: getLabTabPath('validation'),
      age: queueAge.validation,
    },
    {
      key: 'blocked',
      icon: ICONS.actions.alertCircle,
      label: 'Blocked',
      value: blockers.total,
      tone: blockedTone,
      to: blockers.paymentUnpaid > 0 ? getLabTabPath('collection') : undefined,
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
          variant="inline"
          health={health}
          message={healthMessage}
          suggestedTab={suggestedTab}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
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
                  ? formatOldestAge(tile.age)
                  : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
