/**
 * LoadingScope — global/section loading registration (provider + hooks).
 */
/* eslint-disable react-refresh/only-export-components -- single module: provider + hooks + types */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

/** Scope of loading: global, section, or inline. */
export type LoadingScope = 'global' | 'section' | 'inline';

export type LoadingStatus = 'idle' | 'pending' | 'success' | 'error';

export interface UseAsyncActionOptions {
  minDisplayMs?: number;
  scope?: LoadingScope;
  scopeId?: string;
  onError?: (error: unknown) => void;
}

export interface LoadingScopeState {
  global: Set<string>;
  section: Map<string, Set<string>>;
}

type LoadingScopeAction =
  | { type: 'register'; scope: LoadingScope; scopeId?: string; id: string }
  | { type: 'unregister'; scope: LoadingScope; scopeId?: string; id: string };

function loadingScopeReducer(state: LoadingScopeState, action: LoadingScopeAction): LoadingScopeState {
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

export const initialLoadingScopeState: LoadingScopeState = {
  global: new Set(),
  section: new Map(),
};

export interface LoadingScopeContextValue {
  register: (scope: LoadingScope, scopeId: string | undefined, id: string) => void;
  unregister: (scope: LoadingScope, scopeId: string | undefined, id: string) => void;
  state: LoadingScopeState;
}

const LoadingScopeContext = createContext<LoadingScopeContextValue | null>(null);

export function LoadingScopeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(loadingScopeReducer, initialLoadingScopeState);
  const register = useCallback((scope: LoadingScope, scopeId: string | undefined, id: string) => {
    dispatch({ type: 'register', scope, scopeId, id });
  }, []);
  const unregister = useCallback((scope: LoadingScope, scopeId: string | undefined, id: string) => {
    dispatch({ type: 'unregister', scope, scopeId, id });
  }, []);
  const value = useMemo<LoadingScopeContextValue>(
    () => ({ register, unregister, state }),
    [register, unregister, state]
  );
  return <LoadingScopeContext.Provider value={value}>{children}</LoadingScopeContext.Provider>;
}

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
