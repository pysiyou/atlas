/**
 * Public hooks for loading scope. Kept in a separate file so LoadingScopeContext.tsx only exports the Provider (react-refresh).
 */
import { useLoadingScopeContext } from './loadingScopeState';

/** True if any global loader is active. */
export function useIsGlobalLoading(): boolean {
  const { state } = useLoadingScopeContext();
  return state.global.size > 0;
}

/** True if the given section has any active loader. */
export function useIsSectionLoading(sectionId: string): boolean {
  const { state } = useLoadingScopeContext();
  const set = state.section.get(sectionId);
  return (set?.size ?? 0) > 0;
}

/** For use by useAsyncAction / SectionLoadingBoundary to register/unregister. */
export function useLoadingScopeActions() {
  return useLoadingScopeContext();
}
