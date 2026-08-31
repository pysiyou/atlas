import { Icon, type IconName } from '@/components';
import { formatRelativeDateLabel } from '@/utils/date';
import {
  COLORS,
  CHART_SUCCESS,
  formatDuration,
  type DonutChartSegment,
  type SegmentWithPercent,
} from './donutChartUtils';

interface DetailListRowProps {
  item: SegmentWithPercent;
  index: number;
  getItemIcon?: (item: DonutChartSegment) => IconName | undefined;
}

function DetailListRow({ item, index, getItemIcon }: DetailListRowProps) {
  const color = item.color ?? COLORS[index % COLORS.length];
  const iconName = getItemIcon?.(item);
  const hasArrivals = item.arrivedToday != null && item.arrivedToday > 0;

  return (
    <div className="flex items-center gap-3 py-3 min-w-0 border-b border-border-default last:border-b-0">
      <div
        className="shrink-0 w-9 h-9 rounded-md flex items-center justify-center"
        style={{
          backgroundColor: `color-mix(in srgb, ${color} 24%, transparent)`,
          color,
        }}
      >
        {iconName ? (
          <Icon name={iconName} className="w-5 h-5 [&>svg]:shrink-0" />
        ) : (
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="text-sm truncate text-text-primary">{item.name}</span>
          {hasArrivals ? (
            <span
              className="flex items-center gap-0.5 text-xs shrink-0"
              style={{ color: CHART_SUCCESS }}
            >
              +{item.arrivedToday}
              <Icon name="up-trend" className="w-3.5 h-3.5" />
            </span>
          ) : (
            <span className="text-xs shrink-0 text-text-tertiary">&mdash;</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-text-tertiary tabular-nums min-w-0">
          <span>{item.avgWaitMs != null ? `Avg. ${formatDuration(item.avgWaitMs)}` : '—'}</span>
          <span className="shrink-0 text-text-tertiary">
            {item.oldestEntryAt ? `Oldest ${formatRelativeDateLabel(item.oldestEntryAt)}` : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

export interface DetailListSectionProps {
  listItems: SegmentWithPercent[];
  getItemIcon?: (item: DonutChartSegment) => IconName | undefined;
}

export function DetailListSection({ listItems, getItemIcon }: DetailListSectionProps) {
  return (
    <div className="flex-1 min-w-0 flex flex-col border-l border-border-default overflow-hidden">
      <div className="shrink-0 flex flex-col py-2 pr-3 pl-3 overflow-y-auto">
        {listItems.length === 0 ? (
          <p className="text-sm py-2 text-text-tertiary">No data</p>
        ) : (
          listItems.map((item, index) => (
            <DetailListRow key={item.name} item={item} index={index} getItemIcon={getItemIcon} />
          ))
        )}
      </div>
    </div>
  );
}
