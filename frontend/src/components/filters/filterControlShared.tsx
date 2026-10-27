/* eslint-disable react-refresh/only-export-components -- shared filter control helpers */
import { text, RADIUS } from '@/theme/recipes';
import { Icon } from '@/components/primitives';
import type { NumberRangeFilterControl } from './types';
import { ICONS } from '@/config/icons';
import { uppercaseLabel, cn } from '@/utils';

export function resolveNumberRange(control: NumberRangeFilterControl) {
  const minValue = control.minValue ?? 0;
  const maxValue =
    control.maxValue ?? (control.type === 'priceRange' ? 10_000 : 150);
  let sliderMode = control.sliderMode;
  if (!sliderMode) {
    sliderMode = control.type === 'priceRange' ? 'track' : 'histogram';
  }
  const currency = control.currencySymbol ?? '$';
  const formatValue =
    control.formatValue ??
    (sliderMode === 'track'
      ? (n: number) => `${currency}${n.toLocaleString()}`
      : (n: number) => String(n));
  const formatSummary =
    control.formatSummary ??
    (sliderMode === 'track'
      ? ([lo, hi]) => `${currency}${lo.toLocaleString()} – ${currency}${hi.toLocaleString()}`
      : ([lo, hi]) => `${lo}–${hi}`);
  return { minValue, maxValue, sliderMode, formatValue, formatSummary, distribution: control.distribution };
}

export function ModalRadioList({
  options,
  selectedId,
  onChange,
  columns = 1,
}: {
  options: { id: string; label: string }[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
  columns?: 1 | 2;
}) {
  return (
    <div className={cn(columns === 2 ? 'grid grid-cols-2 gap-x-space-6 gap-y-space-2' : 'space-y-space-2')}>
      {options.map(option => {
        const isSelected = selectedId === option.id;
        return (
          <label
            key={option.id}
            className="flex items-center gap-space-3 cursor-pointer group py-space-1 transition-colors"
          >
            <div className="relative flex items-center justify-center shrink-0">
              <input
                type="radio"
                checked={isSelected}
                onChange={() => onChange(isSelected ? null : option.id)}
                className="sr-only"
              />
              <div
                className={cn(
                  `w-5 h-5 ${RADIUS.pill} flex items-center justify-center transition-colors`,
                  isSelected
                    ? 'bg-brand'
                    : 'bg-transparent border-2 border-border-strong group-hover:border-brand'
                )}
              >
                {isSelected && <Icon name={ICONS.actions.check} className="w-3 h-3 text-on-brand" />}
              </div>
            </div>
            <span
              className={cn(
                `${text({ role: 'amount' })} transition-colors`,
                isSelected ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary'
              )}
            >
              {uppercaseLabel(option.label)}
            </span>
          </label>
        );
      })}
    </div>
  );
}
