/**
 * OverlayRangeSlider - Dual-thumb range slider for filter modals and popovers.
 * Layout: slider on top, min/max field row, optional reset + summary footer.
 */

import React, { useCallback } from 'react';
import { RANGE_SLIDER, RADIUS, TYPE } from '@/components/theme/recipes';
import { FORM_FIELD_LABEL, inputInner } from '@/components/inputs/inputStyles';
import { cn } from '@/utils';

const SLIDER_THUMB_CLASS = cn(
  'absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-10 appearance-none bg-transparent pointer-events-none',
  RANGE_SLIDER.thumbSurface(RADIUS.field)
);

export interface OverlayRangeSliderProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min: number;
  max: number;
  hint?: string;
  boundLabels?: { min: string; max: string };
  /** Prefix inside min/max fields (e.g. currency). */
  valuePrefix?: string;
  formatValue?: (value: number) => string;
  onReset?: () => void;
  footerSummary?: string;
}

function defaultFormatValue(value: number): string {
  return String(value);
}

function parseBoundInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export const OverlayRangeSlider: React.FC<OverlayRangeSliderProps> = ({
  value,
  onChange,
  min,
  max,
  hint,
  boundLabels = { min: 'Min', max: 'Max' },
  valuePrefix = '',
  formatValue = defaultFormatValue,
  onReset,
  footerSummary,
}) => {
  const [lo, hi] = value;
  const isDefault = lo === min && hi === max;

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

  const handleMinInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseBoundInput(e.target.value.replace(valuePrefix, ''));
    if (parsed === null) return;
    const clamped = Math.max(min, Math.min(parsed, hi - 1));
    commit([clamped, hi]);
  };

  const handleMaxInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseBoundInput(e.target.value.replace(valuePrefix, ''));
    if (parsed === null) return;
    const clamped = Math.min(max, Math.max(parsed, lo + 1));
    commit([lo, clamped]);
  };

  const minPercent = ((lo - min) / (max - min)) * 100;
  const maxPercent = ((hi - min) / (max - min)) * 100;

  const fieldShell = cn(
    `flex items-center gap-space-1 ${RADIUS.field} bg-surface-page px-space-3 py-space-2 min-h-[2.75rem]`
  );

  const fieldInput = cn(inputInner, TYPE.value, 'w-full tabular-nums text-text-primary');

  return (
    <div className="w-full space-y-space-4">
      {hint ? <p className={TYPE.meta}>{hint}</p> : null}

      <div className="relative h-10 flex items-center select-none px-space-0-5">
        <div className={`absolute inset-x-0 h-1 bg-border-default ${RADIUS.pill}`} />
        <div
          className={`absolute h-1 bg-text-tertiary ${RADIUS.pill}`}
          style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={lo}
          onChange={handleMinChange}
          className={SLIDER_THUMB_CLASS}
          style={{ zIndex: lo > max - 10 ? 5 : 3 }}
          aria-label={boundLabels.min}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={hi}
          onChange={handleMaxChange}
          className={SLIDER_THUMB_CLASS}
          style={{ zIndex: 4 }}
          aria-label={boundLabels.max}
        />
      </div>

      <div className="grid grid-cols-2 gap-space-3">
        <div className="min-w-0">
          <span className={FORM_FIELD_LABEL}>{boundLabels.min}</span>
          <div className={cn(fieldShell, 'mt-space-1')}>
            {valuePrefix ? (
              <span className={cn(TYPE.value, 'text-text-muted shrink-0')}>{valuePrefix}</span>
            ) : null}
            <input
              type="text"
              inputMode="decimal"
              value={formatValue(lo)}
              onChange={handleMinInput}
              className={fieldInput}
              aria-label={boundLabels.min}
            />
          </div>
        </div>
        <div className="min-w-0">
          <span className={FORM_FIELD_LABEL}>{boundLabels.max}</span>
          <div className={cn(fieldShell, 'mt-space-1')}>
            {valuePrefix ? (
              <span className={cn(TYPE.value, 'text-text-muted shrink-0')}>{valuePrefix}</span>
            ) : null}
            <input
              type="text"
              inputMode="decimal"
              value={formatValue(hi)}
              onChange={handleMaxInput}
              className={fieldInput}
              aria-label={boundLabels.max}
            />
          </div>
        </div>
      </div>

      {(onReset || footerSummary) && (
        <div className="flex items-center justify-between pt-space-1">
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
