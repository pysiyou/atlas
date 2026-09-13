/**
 * useResponsiveCard - Generic hook for mobile/desktop card rendering
 *
 * Eliminates duplication of breakpoint detection and conditional rendering
 * across collection, entry, validation, escalation, and recollection cards.
 */

import { useMemo } from 'react';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import type { ResponsiveCardConfig } from './types';

export function useResponsiveCard<TItem, TDerived>({
  item,
  deriveSharedData,
  renderMobile: MobileComponent,
  renderDesktop: DesktopComponent,
  isMobile,
}: ResponsiveCardConfig<TItem, TDerived>) {
  const breakpoint = useBreakpoint();
  const shouldUseMobile = isMobile ?? isBreakpointAtMost(breakpoint, 'sm');

  // Derive shared data once, used by both variants
  const sharedData = useMemo(() => deriveSharedData(item), [item, deriveSharedData]);

  return shouldUseMobile ? <MobileComponent {...(sharedData as any)} /> : <DesktopComponent {...(sharedData as any)} />;
}
