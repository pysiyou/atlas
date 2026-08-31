import { useCallback, useMemo, useReducer, type ReactNode } from 'react';
import { LoadingScopeContext } from './LoadingScopeContext';
import {
  initialLoadingScopeState,
  loadingScopeReducer,
  type LoadingScopeContextValue,
} from './loadingScopeState';
import type { LoadingScope } from './loadingTypes';

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
