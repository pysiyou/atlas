import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FilterState {
  filters: Record<string, Record<string, unknown>>;
  setFilter: (scope: string, key: string, value: unknown) => void;
  getFilter: <T>(scope: string, key: string, defaultValue: T) => T;
  clearFilters: (scope: string) => void;
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      filters: {},

      setFilter: (scope, key, value) => set((state) => ({
        filters: {
          ...state.filters,
          [scope]: { ...state.filters[scope], [key]: value },
        },
      })),

      getFilter: (scope, key, defaultValue) => {
        return (get().filters[scope]?.[key] as typeof defaultValue) ?? defaultValue;
      },

      clearFilters: (scope) => set((state) => ({
        filters: { ...state.filters, [scope]: {} },
      })),
    }),
    { name: 'filter-storage' }
  )
);
