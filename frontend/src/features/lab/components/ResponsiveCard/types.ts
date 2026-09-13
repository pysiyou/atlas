/**
 * Types for ResponsiveCard pattern - shared mobile/desktop rendering
 */

import type { FC, ReactElement } from 'react';

export interface ResponsiveCardConfig<TItem, TDerived> {
  /** Input item/props to derive shared data from */
  item: TItem;
  /** Function to derive shared data used by both mobile and desktop variants */
  deriveSharedData: (item: TItem) => TDerived;
  /** Mobile component renderer */
  renderMobile: FC<TDerived>;
  /** Desktop component renderer */
  renderDesktop: FC<TDerived>;
  /** Optional override for mobile detection (defaults to breakpoint hook) */
  isMobile?: boolean;
}

export type ResponsiveCardHook = <TItem, TDerived>(
  config: ResponsiveCardConfig<TItem, TDerived>
) => ReactElement;
