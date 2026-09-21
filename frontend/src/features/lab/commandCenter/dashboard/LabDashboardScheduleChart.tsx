/**
 * Seven-day lab volume bars with week-over-week footer.
 * WoW percent is computed server-side against the prior 7-day window.
 */
import React, { useMemo } from 'react';
import { Panel } from '@/components/surfaces/Panel';
import { cn, formatDate } from '@/utils';
import type { DashboardKpis, VolumeDayPoint } from '../commandCenterModel';
import { DASHBOARD_CHART } from '../dashboardStyles';

export interface LabDashboardScheduleChartProps {
  volumeByDay: VolumeDayPoint[];
  kpis: DashboardKpis;
}

export const LabDashboardScheduleChart: React.FC<LabDashboardScheduleChartProps> = ({
  volumeByDay,
  kpis,
}) => {
  const maxCount = useMemo(
    () => Math.max(1, ...volumeByDay.map(point => point.count)),
    [volumeByDay],
  );
  const wow = kpis.volumeWowPercent;
  const wowLabel =
    wow == null ? 'vs last week' : `${wow > 0 ? '+' : ''}${wow}% vs last week`;

  return (
    <Panel title="Schedule for Today">
      {volumeByDay.length === 0 ? (
        <p className={DASHBOARD_CHART.footer}>No volume in the last 7 days.</p>
      ) : (
        <>
          <div className={DASHBOARD_CHART.plot} role="img" aria-label="Tests per day, last 7 days">
            {volumeByDay.map(point => {
              const heightPct = (point.count / maxCount) * 100;
              return (
                <div key={point.date} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                  <div className={DASHBOARD_CHART.barStack} style={{ height: `${heightPct}%` }}>
                    <div className={DASHBOARD_CHART.barTop} style={{ flex: '3 1 0%' }} />
                    <div className={DASHBOARD_CHART.barBottom} style={{ flex: '2 1 0%' }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className={DASHBOARD_CHART.axis}>
            {volumeByDay.map(point => (
              <span key={point.date} className={DASHBOARD_CHART.axisLabel}>
                {formatDate(point.date, 'MMM d')}
              </span>
            ))}
          </div>
          <div className={DASHBOARD_CHART.footer}>
            <span>{kpis.volumeTotal.toLocaleString()} Total Tests</span>
            <span className={cn(wow != null && wow >= 0 ? DASHBOARD_CHART.wowUp : DASHBOARD_CHART.wowDown)}>
              {wowLabel}
            </span>
          </div>
        </>
      )}
    </Panel>
  );
};
