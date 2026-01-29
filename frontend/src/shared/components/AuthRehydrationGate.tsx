/**
 * Ensures auth store never blocks the UI forever.
 *
 * Zustand persist can leave isLoading true if the rehydration completion
 * callback never runs (e.g. HMR, storage quirks). This component runs once
 * on mount and, after one frame, sets isLoading to false so login/dashboard
 * render instead of infinite "Loading...".
 *
 * Mount once high in the tree (e.g. inside Router). No duplicate gate logic
 * in PublicRoute or ProtectedFeatureRoute.
 */
import { useEffect } from 'react';
import { useAuthStore } from '@/shared/stores/auth.store';

export const AuthRehydrationGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (useAuthStore.getState().isLoading) {
        useAuthStore.setState({ isLoading: false });
      }
    });
    return () => cancelAnimationFrame(id);
  }, []);
  return <>{children}</>;
};
