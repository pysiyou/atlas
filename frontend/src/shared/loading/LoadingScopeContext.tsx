/**
 * LoadingScopeContext - Provider only. State and hooks in loadingScopeState.ts / loadingScopeHooks.ts (react-refresh).
 */
import { useCallback, useMemo, useReducer, type ReactNode } from 'react';
import type { LoadingScope } from './types';
import { LoadingScopeContext, reducer, initialState } from './loadingScopeState';

export function LoadingScopeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const register = useCallback((scope: LoadingScope, scopeId: string | undefined, id: string) => {
    dispatch({ type: 'register', scope, scopeId, id });
  }, []);

  const unregister = useCallback((scope: LoadingScope, scopeId: string | undefined, id: string) => {
    dispatch({ type: 'unregister', scope, scopeId, id });
  }, []);

  const value = useMemo(() => ({ register, unregister, state }), [register, unregister, state]);

  return <LoadingScopeContext.Provider value={value}>{children}</LoadingScopeContext.Provider>;
}
