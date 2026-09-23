/**
 * HistogramRangeSlider — distribution bars + dual-thumb range (Airbnb-style).
 * Bar bases sit on the slider track; zero-count buckets have no height above the line.
 */

import React, { useCallback, useMemo } from 'react';
import { RANGE_SLIDER, RADIUS, TYPE } from '@/components/theme/recipes';
import { cn } from '@/utils';

const SLIDER_THUMB_CLASS = cn(
  'absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-10 appearance-none bg-transparent pointer-events-none',
  RANGE_SLIDER.thumbBrandRing(RADIUS.pill)
);

const DEFAULT_BUCKET_COUNT = 52;
const HISTOGRAM_HEIGHT_CLASS = 'h-16';

export interface HistogramRangeSliderProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min: number;
  max: number;
  /** Normalized bucket heights 0–1; length sets bar count when provided. */
  histogram?: number[];
  bucketCount?: number;
  formatValue?: (value: number) => string;
  onReset?: () => void;
  footerSummary?: string;
  minAriaLabel?: string;
  maxAriaLabel?: string;
}

function defaultFormatValue(value: number): string {
  return String(value);
}

function placeholderHistogram(bucketCount: number): number[] {
  return Array.from({ length: bucketCount }, (_, i) => {
    const wave = Math.sin((i / bucketCount) * Math.PI * 2) * 0.15;
    return 0.35 + wave;
  });
}

export const HistogramRangeSlider: React.FC<HistogramRangeSliderProps> = ({
  value,
  onChange,
  min,
  max,
  histogram,
  bucketCount = DEFAULT_BUCKET_COUNT,
  formatValue = defaultFormatValue,
  onReset,
  footerSummary,
  minAriaLabel = 'Minimum',
  maxAriaLabel = 'Maximum',
}) => {
  const [lo, hi] = value;
  const isDefault = lo === min && hi === max;

  const bars = useMemo(() => {
    if (histogram && histogram.length > 0) return histogram;
    return placeholderHistogram(bucketCount);
  }, [histogram, bucketCount]);

  const commit = useCallback(
    (next: [number, number]) => {
      onChange(next);
    },
    [onChange]
  );

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(Number(e.target.value), hi - 1);
    commit([newMin, hi]);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(Number(e.target.value), lo + 1);
    commit([lo, newMax]);
  };

  const minPercent = ((lo - min) / (max - min)) * 100;
  const maxPercent = ((hi - min) / (max - min)) * 100;

  return (
    <div className="w-full space-y-space-2">
      <div className="relative w-full px-space-0-5">
        <div className={cn('relative w-full', HISTOGRAM_HEIGHT_CLASS)}>
          <div className="absolute inset-0 flex items-end gap-px" aria-hidden>
            {bars.map((height, index) => (
              <div
                key={index}
                className={cn(
                  'flex-1 min-w-0 bg-border-default',
                  height > 0 && 'rounded-t-[2px]'
                )}
                style={{
                  height: height > 0 ? `${height * 100}%` : '0',
                }}
              />
            ))}
          </div>

          <div
            className={cn(
              'pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-border-default z-[1]',
              RADIUS.pill
            )}
          />
          <div
            className={cn(
              'pointer-events-none absolute bottom-0 h-1 bg-brand z-[1]',
              RADIUS.pill
            )}
            style={{
              left: `${minPercent}%`,
              width: `${maxPercent - minPercent}%`,
              transform: 'translateY(50%)',
            }}
          />

          <div className="absolute inset-x-0 bottom-0 z-[2] h-10 translate-y-1/2">
            <input
              type="range"
              min={min}
              max={max}
              value={lo}
              onChange={handleMinChange}
              className={SLIDER_THUMB_CLASS}
              style={{ zIndex: lo > max - 10 ? 5 : 3 }}
              aria-label={minAriaLabel}
            />
            <input
              type="range"
              min={min}
              max={max}
              value={hi}
              onChange={handleMaxChange}
              className={SLIDER_THUMB_CLASS}
              style={{ zIndex: 4 }}
              aria-label={maxAriaLabel}
            />
          </div>
        </div>

        <div className="relative h-6 mt-space-4">
          <span
            className={cn(
              'absolute -translate-x-1/2 tabular-nums text-text-primary font-medium',
              TYPE.amount
            )}
            style={{ left: `${minPercent}%` }}
          >
            {formatValue(lo)}
          </span>
          <span
            className={cn(
              'absolute -translate-x-1/2 tabular-nums text-text-primary font-medium',
              TYPE.amount
            )}
            style={{ left: `${maxPercent}%` }}
          >
            {formatValue(hi)}
          </span>
        </div>
      </div>

      {(onReset || footerSummary) && (
        <div className="flex items-center justify-between pt-space-2">
          {onReset ? (
            <button
              type="button"
              onClick={onReset}
              disabled={isDefault}
              className={cn(
                TYPE.value,
                'text-text-primary transition-colors',
                isDefault
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:text-brand cursor-pointer'
              )}
            >
              Reset
            </button>
          ) : (
            <span />
          )}
          {footerSummary ? (
            <span className={cn(TYPE.caption, 'text-text-disabled')}>{footerSummary}</span>
          ) : null}
        </div>
      )}
    </div>
  );
};
