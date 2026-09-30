/**
 * Header meta for the Today panel — compact UTC day label.
 */
import React from 'react';
import { TODAY_KPI } from './commandCenterStyles';

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

  return <span className={TODAY_KPI.headerRange}>{meta}</span>;
};
