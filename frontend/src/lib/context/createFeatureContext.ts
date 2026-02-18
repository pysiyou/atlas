import { createContext, useContext } from 'react';

/**
 * Factory function to create typed context and hook for a feature
 * Eliminates boilerplate and ensures type safety
 *
 * @example
 * ```typescript
 * export const { Context: PatientsContext, useFeature: usePatients } =
 *   createFeatureContext<PatientsContextType>('Patients');
 * ```
 */
export function createFeatureContext<T>(name: string) {
  const Context = createContext<T | undefined>(undefined);
  Context.displayName = `${name}Context`;

  function useFeature(): T {
    const context = useContext(Context);
    if (!context) {
      throw new Error(`use${name} must be used within ${name}Provider`);
    }
    return context;
  }

  return { Context, useFeature } as const;
}
