/**
 * useLabWorkflowResponsiveCard — mobile/desktop card rendering from shared derived props.
 */

import { useMemo, type FC, type ReactElement } from 'react';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';

export interface ResponsiveCardConfig<TItem, TDerived> {
  item: TItem;
  deriveSharedData: (item: TItem) => TDerived;
  renderMobile: FC<TDerived>;
  renderDesktop: FC<TDerived>;
  isMobile?: boolean;
}

export type ResponsiveCardHook = <TItem, TDerived>(
  config: ResponsiveCardConfig<TItem, TDerived>
) => ReactElement;

export function useLabWorkflowResponsiveCard<TItem, TDerived>({
  item,
  deriveSharedData,
  renderMobile: MobileComponent,
  renderDesktop: DesktopComponent,
  isMobile,
}: ResponsiveCardConfig<TItem, TDerived>) {
  const breakpoint = useBreakpoint();
  const shouldUseMobile = isMobile ?? isBreakpointAtMost(breakpoint, 'sm');

  const sharedData = useMemo(() => deriveSharedData(item), [item, deriveSharedData]);

  return shouldUseMobile ? (
    <MobileComponent {...(sharedData as TDerived & object)} />
  ) : (
    <DesktopComponent {...(sharedData as TDerived & object)} />
  );
}
