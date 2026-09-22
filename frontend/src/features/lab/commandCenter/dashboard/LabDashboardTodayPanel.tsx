/**
 * Today — open mix strip and grouped meters.
 */
import React, { useMemo } from 'react';
import { Panel } from '@/components/surfaces/Panel';
import { LAB_COPY } from '../../constants/labConstants';
import type { LabTodayPanelMix } from '../commandCenterModel';
import {
  TODAY_IN_LAB_KEYS,
  TODAY_PANEL,
  TODAY_PANEL_COLORS,
} from '../dashboardStyles';

export interface LabDashboardTodayPanelProps {
  mix: LabTodayPanelMix;
}

type TodayPanelKey = keyof LabTodayPanelMix;

type SectionConfig = {
  id: keyof typeof LAB_COPY.dashboard.todaySections;
  keys: TodayPanelKey[];
  showShareOfOpen?: boolean;
};

const SECTIONS: SectionConfig[] = [
  { id: 'intake', keys: ['newOrders'] },
  { id: 'inLab', keys: [...TODAY_IN_LAB_KEYS], showShareOfOpen: true },
  { id: 'released', keys: ['validatedToday'] },
];

export const LabDashboardTodayPanel: React.FC<LabDashboardTodayPanelProps> = ({ mix }) => {
  const openPipelineTotal = mix.pending + mix.collected + mix.resulted + mix.blocked;
  const isEmpty =
    openPipelineTotal === 0 && mix.validatedToday === 0 && mix.newOrders === 0;

  const barScale = useMemo(
    () => Math.max(1, ...SECTIONS.flatMap(section => section.keys.map(key => mix[key]))),
    [mix],
  );

  const compositionSegments = useMemo(() => {
    if (openPipelineTotal <= 0) return [];
    return TODAY_IN_LAB_KEYS.map(key => ({
      key,
      count: mix[key],
      color: TODAY_PANEL_COLORS[key],
    })).filter(segment => segment.count > 0);
  }, [mix, openPipelineTotal]);

  const copy = LAB_COPY.dashboard;

  return (
    <Panel title="Today" bodyClassName="flex min-h-0 flex-1 flex-col" padding="none">
      <div className={TODAY_PANEL.body}>
        {compositionSegments.length > 0 ? (
          <div className={TODAY_PANEL.composition} aria-label="Open pipeline mix">
            <span className={TODAY_PANEL.compositionLabel}>Open mix</span>
            <div className={TODAY_PANEL.compositionTrack}>
              {compositionSegments.map(segment => (
                <div
                  key={segment.key}
                  className={TODAY_PANEL.compositionSegment}
                  style={{
                    flexGrow: segment.count,
                    backgroundColor: segment.color,
                  }}
                  title={`${copy.todayRows[segment.key].label}: ${segment.count}`}
                />
              ))}
            </div>
          </div>
        ) : null}

        {isEmpty ? (
          <p className={TODAY_PANEL.emptyHint}>{copy.todayPanelMetaEmpty}</p>
        ) : (
          SECTIONS.map(section => {
            const visibleKeys = section.keys.filter(key => mix[key] > 0);
            if (visibleKeys.length === 0) return null;

            return (
              <section
                key={section.id}
                className={TODAY_PANEL.section}
                aria-label={copy.todaySections[section.id]}
              >
                <h3 className={TODAY_PANEL.sectionLabel}>{copy.todaySections[section.id]}</h3>
                <ul className={TODAY_PANEL.rows}>
                  {visibleKeys.map(key => {
                    const row = copy.todayRows[key];
                    const count = mix[key];
                    const share =
                      section.showShareOfOpen && openPipelineTotal > 0
                        ? `${Math.round((count / openPipelineTotal) * 100)}% of open`
                        : null;

                    return (
                      <li key={key} className={TODAY_PANEL.row}>
                        <div className={TODAY_PANEL.rowHead}>
                          <span className={TODAY_PANEL.rowTitle}>{row.label}</span>
                          <span className={TODAY_PANEL.rowCount}>{count.toLocaleString()}</span>
                        </div>
                        <p className={TODAY_PANEL.rowHint}>{row.description}</p>
                        {share ? <span className={TODAY_PANEL.rowMeta}>{share}</span> : null}
                        <div
                          className={TODAY_PANEL.meterTrack}
                          role="progressbar"
                          aria-valuemin={0}
                          aria-valuemax={barScale}
                          aria-valuenow={count}
                          aria-label={row.label}
                        >
                          <div
                            className={TODAY_PANEL.meterFill}
                            style={{
                              width: `${(count / barScale) * 100}%`,
                              backgroundColor: TODAY_PANEL_COLORS[key],
                            }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })
        )}
      </div>
    </Panel>
  );
};
