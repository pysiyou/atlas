/**
 * Header meta for the Today panel — compact UTC day label.
 */
import React from 'react';
import { METER_KPI } from '@/theme/recipes';

export interface TodayPanelHeaderMetaProps {
  headerRange: string;
  totalWorked: number;
}

export const TodayPanelHeaderMeta: React.FC<TodayPanelHeaderMetaProps> = ({
  headerRange,
  totalWorked,
}) => {
  const meta =
    totalWorked > 0 ? `${headerRange} · ${totalWorked.toLocaleString()}` : headerRange;

  return <span className={METER_KPI.headerRange}>{meta}</span>;
};
