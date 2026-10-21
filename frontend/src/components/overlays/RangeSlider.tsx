/**
 * Dual-thumb range: histogram (native inputs) or track (drag handles).
 */

import React, { useCallback, useMemo } from 'react';
import { text, RANGE_SLIDER, RADIUS, CONTROL, PRICE_RANGE_TYPE } from '@/theme/recipes';
import { cn } from '@/utils';
import { useDualHandleSlider } from '@/hooks/useDualHandleSlider';

export type RangeTuple = [number, number];

const SLIDER_THUMB_CLASS = cn(
  'absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-10 appearance-none bg-transparent pointer-events-none',
  RANGE_SLIDER.thumbBrandRing(RADIUS.pill)
);

const DEFAULT_BUCKET_COUNT = 52;
const HISTOGRAM_HEIGHT_CLASS = 'h-16';

export interface RangeSliderProps {
  value: RangeTuple;
  onChange: (value: RangeTuple) => void;
  minValue: number;
  maxValue: number;
  mode: 'histogram' | 'track';
  distribution?: number[];
  bucketCount?: number;
  formatValue?: (value: number) => string;
  summary?: React.ReactNode;
  onReset?: () => void;
  minAriaLabel?: string;
  maxAriaLabel?: string;
}

function defaultFormatValue(value: number): string {
  return String(value);
}

function placeholderDistribution(bucketCount: number): number[] {
  return Array.from({ length: bucketCount }, (_, i) => {
    const wave = Math.sin((i / bucketCount) * Math.PI * 2) * 0.15;
    return 0.35 + wave;
  });
}

function TrackRangeSlider({
  value,
  onChange,
  minValue,
  maxValue,
  formatValue,
}: Pick<RangeSliderProps, 'value' | 'onChange' | 'minValue' | 'maxValue' | 'formatValue'>) {
  const fmt = formatValue ?? defaultFormatValue;
  const { localValue, sliderRef, getPercentage, onMouseDown } = useDualHandleSlider(
    value,
    onChange,
    minValue,
    maxValue
  );

  return (
    <div className="space-y-space-4">
      <div className={`flex items-center justify-between ${PRICE_RANGE_TYPE.value}`}>
        <span>{fmt(localValue[0])}</span>
        <span>{fmt(localValue[1])}</span>
      </div>
      <div className="relative h-6 flex items-center select-none touch-none" ref={sliderRef}>
        <div className={`absolute w-full h-1.5 bg-border-default ${RADIUS.pill} overflow-hidden`}>
          <div
            className="absolute h-full bg-brand"
            style={{
              left: `${getPercentage(localValue[0])}%`,
              width: `${getPercentage(localValue[1]) - getPercentage(localValue[0])}%`,
            }}
          />
        </div>
        <div
          className={`absolute w-5 h-5 bg-surface border-2 border-brand ${RADIUS.pill} shadow cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-10 ${CONTROL.focusBrand}`}
          style={{ left: `calc(${getPercentage(localValue[0])}% - 10px)` }}
          onMouseDown={onMouseDown('min')}
        />
        <div
          className={`absolute w-5 h-5 bg-surface border-2 border-brand ${RADIUS.pill} shadow cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-10 ${CONTROL.focusBrand}`}
          style={{ left: `calc(${getPercentage(localValue[1])}% - 10px)` }}
          onMouseDown={onMouseDown('max')}
        />
      </div>
      <div className={`flex justify-between items-center ${PRICE_RANGE_TYPE.bound}`}>
        <span>{fmt(minValue)}</span>
        <span>{fmt(maxValue)}</span>
      </div>
    </div>
  );
}

function HistogramModeSliderBody({
  value,
  onChange,
  minValue,
  maxValue,
  distribution,
  bucketCount = DEFAULT_BUCKET_COUNT,
  formatValue = defaultFormatValue,
  onReset,
  summary,
  minAriaLabel = 'Minimum',
  maxAriaLabel = 'Maximum',
}: RangeSliderProps) {
  const [lo, hi] = value;
  const isDefault = lo === minValue && hi === maxValue;

  const bars = useMemo(() => {
    if (distribution && distribution.length > 0) return distribution;
    return placeholderDistribution(bucketCount);
  }, [distribution, bucketCount]);

  const commit = useCallback((next: RangeTuple) => onChange(next), [onChange]);

  const minPercent = ((lo - minValue) / (maxValue - minValue)) * 100;
  const maxPercent = ((hi - minValue) / (maxValue - minValue)) * 100;

  return (
    <div className="w-full space-y-space-2">
      <div className="relative w-full px-space-0-5">
        <div className={cn('relative w-full', HISTOGRAM_HEIGHT_CLASS)}>
          <div className="absolute inset-0 flex items-end gap-px" aria-hidden>
            {bars.map((height, index) => (
              <div
                key={index}
                className={cn('flex-1 min-w-0 bg-border-default', height > 0 && 'rounded-t-[2px]')}
                style={{ height: height > 0 ? `${height * 100}%` : '0' }}
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
            className={cn('pointer-events-none absolute bottom-0 h-1 bg-brand z-[1]', RADIUS.pill)}
            style={{
              left: `${minPercent}%`,
              width: `${maxPercent - minPercent}%`,
              transform: 'translateY(50%)',
            }}
          />
          <div className="absolute inset-x-0 bottom-0 z-[2] h-10 translate-y-1/2">
            <input
              type="range"
              min={minValue}
              max={maxValue}
              value={lo}
              onChange={e => commit([Math.min(Number(e.target.value), hi - 1), hi])}
              className={SLIDER_THUMB_CLASS}
              style={{ zIndex: lo > maxValue - 10 ? 5 : 3 }}
              aria-label={minAriaLabel}
            />
            <input
              type="range"
              min={minValue}
              max={maxValue}
              value={hi}
              onChange={e => commit([lo, Math.max(Number(e.target.value), lo + 1)])}
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
              text({ role: 'amount' })
            )}
            style={{ left: `${minPercent}%` }}
          >
            {formatValue(lo)}
          </span>
          <span
            className={cn(
              'absolute -translate-x-1/2 tabular-nums text-text-primary font-medium',
              text({ role: 'amount' })
            )}
            style={{ left: `${maxPercent}%` }}
          >
            {formatValue(hi)}
          </span>
        </div>
      </div>
      {(onReset || summary) && (
        <div className="flex items-center justify-between pt-space-2">
          {onReset ? (
            <button
              type="button"
              onClick={onReset}
              disabled={isDefault}
              className={cn(
                text({ role: 'body' }),
                'text-text-primary transition-colors',
                isDefault ? 'opacity-40 cursor-not-allowed' : 'hover:text-brand cursor-pointer'
              )}
            >
              Reset
            </button>
          ) : (
            <span />
          )}
          {summary ? (
            <span className={cn(text({ role: 'caption' }), 'text-text-disabled')}>{summary}</span>
          ) : null}
        </div>
      )}
    </div>
  );
}

export const RangeSlider: React.FC<RangeSliderProps> = props => {
  if (props.mode === 'track') {
    return (
      <TrackRangeSlider
        value={props.value}
        onChange={props.onChange}
        minValue={props.minValue}
        maxValue={props.maxValue}
        formatValue={props.formatValue}
      />
    );
  }
  return <HistogramModeSliderBody {...props} />;
};
