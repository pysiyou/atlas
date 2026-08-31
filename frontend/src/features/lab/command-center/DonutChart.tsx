/**
 * DonutChart - Donut with center total, segment labels, optional detail list.
 * Use valueLabel for units (e.g. "tests", "orders"). Pass getItemIcon for list row icons when needed.
 */

import React, { useMemo } from 'react';
import type { IconName } from '@/components';
import { COLORS, type DonutChartSegment } from './donutChartUtils';
import { ChartSection } from './DonutChartSection';
import { DetailListSection } from './DonutDetailList';

export type { DonutChartSegment };

export interface DonutChartProps {
  data: DonutChartSegment[];
  title?: string;
  subTitle?: string;
  valueLabel?: string;
  showHeader?: boolean;
  /** When false, only pie + segment labels (no right-hand list). Default true. */
  showListSection?: boolean;
  /** Optional icon per item for list rows. Omit for no icon (colored dot only). */
  getItemIcon?: (item: DonutChartSegment) => IconName | undefined;
  className?: string;
  innerRadius?: number | string;
  outerRadius?: number | string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  title = 'Distribution',
  subTitle,
  valueLabel = 'items',
  showHeader = false,
  showListSection = true,
  getItemIcon,
  className = '',
  innerRadius = '55%',
  outerRadius = '85%',
}) => {
  const { pieData, total, listItems } = useMemo(() => {
    const sum = data.reduce((a, b) => a + b.value, 0);
    const withColor = data.map((d, i) => ({ ...d, color: d.color ?? COLORS[i % COLORS.length] }));
    const withPercent = withColor.map(d => ({
      ...d,
      percent: sum > 0 ? Math.round((d.value / sum) * 100) : 0,
    }));
    return { pieData: withColor.filter(d => d.value > 0), total: sum, listItems: withPercent };
  }, [data]);

  return (
    <div
      className={`flex flex-col h-full w-full min-w-0 min-h-0 bg-surface rounded overflow-hidden shadow-sm ${className}`}
    >
      {showHeader && (
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-lg truncate text-text-primary">{title}</h3>
            <button
              type="button"
              className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm transition-opacity hover:opacity-80 bg-surface-hover text-text-tertiary"
              aria-label="Help"
            >
              ?
            </button>
          </div>
        </div>
      )}
      <div className="flex-1 min-h-[200px] min-w-0 flex flex-row overflow-hidden">
        <ChartSection
          pieData={pieData}
          total={total}
          segmentLabels={listItems}
          valueLabel={valueLabel}
          subTitle={subTitle}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          widthPercent={showListSection ? 52 : 100}
        />
        {showListSection && (
          <DetailListSection listItems={listItems} getItemIcon={getItemIcon} />
        )}
      </div>
    </div>
  );
};
