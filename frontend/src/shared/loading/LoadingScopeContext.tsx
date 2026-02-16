/**
 * LoadingScopeContext - Tracks active loaders by scope for global/section/inline granularity.
 * Provider holds global Set and section Map; consumers use useIsGlobalLoading / useIsSectionLoading.
 * @module shared/loading/LoadingScopeContext
 */

import {
  createContext,
  useCallback,
  useContext,
  useReducer,
  useMemo,
  type ReactNode,
} from 'react';
import type { LoadingScope } from './types';

interface LoadingState {
  global: Set<string>;
  section: Map<string, Set<string>>;
}

type Action =
  | { type: 'register'; scope: LoadingScope; scopeId?: string; id: string }
  | { type: 'unregister'; scope: LoadingScope; scopeId?: string; id: string };

function reducer(state: LoadingState, action: Action): LoadingState {
  switch (action.type) {
    case 'register': {
      if (action.scope === 'global') {
        const next = new Set(state.global);
        next.add(action.id);
        return { ...state, global: next };
      }
      if (action.scope === 'section' && action.scopeId) {
        const nextMap = new Map(state.section);
        const set = nextMap.get(action.scopeId) ?? new Set<string>();
        const nextSet = new Set(set);
        nextSet.add(action.id);
        nextMap.set(action.scopeId, nextSet);
        return { ...state, section: nextMap };
      }
      return state;
    }
    case 'unregister': {
      if (action.scope === 'global') {
        const next = new Set(state.global);
        next.delete(action.id);
        return { ...state, global: next };
      }
      if (action.scope === 'section' && action.scopeId) {
        const nextMap = new Map(state.section);
        const set = nextMap.get(action.scopeId);
        if (set) {
          const nextSet = new Set(set);
          nextSet.delete(action.id);
          if (nextSet.size === 0) nextMap.delete(action.scopeId);
          else nextMap.set(action.scopeId, nextSet);
        }
        return { ...state, section: nextMap };
      }
      return state;
    }
    default:
      return state;
  }
}

interface LoadingScopeContextValue {
  register: (scope: LoadingScope, scopeId: string | undefined, id: string) => void;
  unregister: (scope: LoadingScope, scopeId: string | undefined, id: string) => void;
  state: LoadingState;
}

const LoadingScopeContext = createContext<LoadingScopeContextValue | null>(null);

const initialState: LoadingState = {
  global: new Set(),
  section: new Map(),
};

export function LoadingScopeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const register = useCallback(
    (scope: LoadingScope, scopeId: string | undefined, id: string) => {
      dispatch({ type: 'register', scope, scopeId, id });
    },
    []
  );

  const unregister = useCallback(
    (scope: LoadingScope, scopeId: string | undefined, id: string) => {
      dispatch({ type: 'unregister', scope, scopeId, id });
    },
    []
  );

  const value = useMemo(
    () => ({ register, unregister, state }),
    [register, unregister, state]
  );

  return (
    <LoadingScopeContext.Provider value={value}>
      {children}
    </LoadingScopeContext.Provider>
  );
}

function useLoadingScopeContext(): LoadingScopeContextValue {
  const ctx = useContext(LoadingScopeContext);
  if (!ctx) {
    return {
      register: () => {},
      unregister: () => {},
      state: initialState,
    };
  }
  return ctx;
}

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
