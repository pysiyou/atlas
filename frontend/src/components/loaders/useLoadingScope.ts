import { useContext } from 'react';
import { LoadingScopeContext } from './LoadingScopeContext';
import { initialLoadingScopeState, type LoadingScopeContextValue } from './loadingScopeState';

function useLoadingScopeContext(): LoadingScopeContextValue {
  const ctx = useContext(LoadingScopeContext);
  if (!ctx) {
    return {
      register: () => {},
      unregister: () => {},
      state: initialLoadingScopeState,
    };
  }
  return ctx;
}

export function useIsGlobalLoading(): boolean {
  const { state } = useLoadingScopeContext();
  return state.global.size > 0;
}

export function useIsSectionLoading(sectionId: string): boolean {
  const { state } = useLoadingScopeContext();
  const set = state.section.get(sectionId);
  return (set?.size ?? 0) > 0;
}

export function useLoadingScopeActions(): LoadingScopeContextValue {
  return useLoadingScopeContext();
}
