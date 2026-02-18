/**
 * Public hooks for loading scope.
 */
import { useLoadingScopeContext } from './loadingScopeState';

export function useIsGlobalLoading(): boolean {
  const { state } = useLoadingScopeContext();
  return state.global.size > 0;
}

export function useIsSectionLoading(sectionId: string): boolean {
  const { state } = useLoadingScopeContext();
  const set = state.section.get(sectionId);
  return (set?.size ?? 0) > 0;
}

export function useLoadingScopeActions() {
  return useLoadingScopeContext();
}
