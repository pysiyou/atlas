/**
 * Age range histogram slider — popover/modal body (no trigger).
 */

import React from 'react';
import { HistogramRangeSlider } from '@/components';

export interface AgeRangeSliderPanelProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min: number;
  max: number;
  histogram?: number[];
  resultSummary?: string;
  onReset?: () => void;
}

export const AgeRangeSliderPanel: React.FC<AgeRangeSliderPanelProps> = ({
  value,
  onChange,
  min,
  max,
  histogram,
  resultSummary,
  onReset,
}) => (
  <HistogramRangeSlider
    value={value}
    onChange={onChange}
    min={min}
    max={max}
    histogram={histogram}
    formatValue={n => String(n)}
    onReset={onReset}
    footerSummary={resultSummary}
    minAriaLabel="Minimum age"
    maxAriaLabel="Maximum age"
  />
);
