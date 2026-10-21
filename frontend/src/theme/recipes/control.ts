/** Focus rings and control chrome. */

import { SHADOW } from './spacing';

export const RANGE_SLIDER = {
  /** Brand-ring thumbs for histogram age range slider. */
  thumbBrandRing: (radiusField: string) =>
    `[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-surface [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand [&::-webkit-slider-thumb]:${radiusField} [&::-webkit-slider-thumb]:${SHADOW.raised} [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-surface [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-brand [&::-moz-range-thumb]:${radiusField} [&::-moz-range-thumb]:${SHADOW.raised} [&::-moz-range-thumb]:cursor-pointer`,
} as const;

export const CONTROL = {
  hoverBorder: 'hover:border-border-hover',
  focus: 'focus:outline-none focus:ring-1 focus:ring-brand focus:ring-opacity-20 focus:border-brand',
  focusWithin: 'focus-within:outline-none focus-within:border-brand focus-within:ring-1 focus-within:ring-brand focus-within:ring-opacity-20',
  error: 'border-border-error focus:border-border-error focus:ring-danger focus:ring-opacity-20',
  errorWithin: 'border-border-error focus-within:border-border-error focus-within:ring-danger focus-within:ring-opacity-20',
  open: 'border-brand ring-1 ring-brand ring-opacity-20',
  focusVisible:
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
  focusVisibleBrand: 'focus-visible:ring-brand/30',
  focusVisibleTight:
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:ring-offset-1 focus-visible:ring-offset-surface',
  focusVisibleDanger:
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-1',
  focusSubtle: 'focus:outline-none focus:ring-1 focus:ring-brand/30',
  focusBrand: 'focus:outline-none focus:ring-2 focus:ring-brand/30',
  focusBrandSoft: 'focus:outline-none focus:ring-2 focus:ring-brand/20',
  focusVisibleFlat: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30',
  segmentActive: `${SHADOW.subtle} ring-1 ring-ring-subtle`,
  choiceSelected: `scale-110 ring-2 ring-offset-2 ring-brand ${SHADOW.raised}`,
  height: 'h-control',
  heightMultiline: 'min-h-control-multiline',
  minHeight: 'min-h-control',
} as const;

export const PROMO_CONTROL = {
  focusField:
    'focus:outline-none focus:ring-2 focus:ring-promo-input-focus focus:ring-opacity-50 focus:border-promo-input-focus',
  focusSubmit:
    'focus:outline-none focus:ring-2 focus:ring-promo-input-focus focus:ring-opacity-50 focus:ring-offset-2 focus:ring-offset-promo-panel',
} as const;

export const PROMO_SHADOW = {
  card: SHADOW.modal,
  accent: SHADOW.overlay,
  logo: SHADOW.raised,
} as const;
