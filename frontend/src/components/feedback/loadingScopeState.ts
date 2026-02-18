/**
 * Loading scope context state and internal hook.
 */
import { createContext, useContext } from 'react';
import type { LoadingScope } from './loadingTypes';

export interface LoadingState {
  global: Set<string>;
  section: Map<string, Set<string>>;
}

type Action =
  | { type: 'register'; scope: LoadingScope; scopeId?: string; id: string }
  | { type: 'unregister'; scope: LoadingScope; scopeId?: string; id: string };

export function reducer(state: LoadingState, action: Action): LoadingState {
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

export interface LoadingScopeContextValue {
  register: (scope: LoadingScope, scopeId: string | undefined, id: string) => void;
  unregister: (scope: LoadingScope, scopeId: string | undefined, id: string) => void;
  state: LoadingState;
}

export const LoadingScopeContext = createContext<LoadingScopeContextValue | null>(null);

export const initialState: LoadingState = {
  global: new Set(),
  section: new Map(),
};

export function useLoadingScopeContext(): LoadingScopeContextValue {
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
