import { type ReactNode, useCallback, useState } from 'react';

export interface CrudConfig<T extends { id: string }> {
  storageKey: string;
  name: string;
  generateId: () => string;
  onBeforeAdd?: (item: Omit<T, 'id'>) => T;
  onBeforeUpdate?: (id: string, updates: Partial<T>, current: T) => Partial<T>;
}

export interface CrudProviderProps<T> {
  children: ReactNode;
  initialData?: T[];
}

export interface CrudContextValue<T extends { id: string }> {
  items: T[];
  add: (item: Omit<T, 'id'>) => T;
  update: (id: string, updates: Partial<T>) => void;
  remove: (id: string) => void;
  getById: (id: string) => T | undefined;
  refresh: () => void;
}

/**
 * Factory to create a CRUD provider with standard operations
 * Eliminates repetitive CRUD boilerplate across features
 * 
 * @example
 * ```typescript
 * const PatientsProvider = createCrudProvider<Patient>(
 *   {
 *     storageKey: STORAGE_KEYS.PATIENTS,
 *     name: 'Patients',
 *     generateId: generatePatientId,
 *     onBeforeAdd: (patient) => ({
 *       ...patient,
 *       id: generatePatientId(),
 *       createdAt: new Date().toISOString(),
 *     }),
 *   },
 *   PatientsContext
 * );
 * ```
 */
export function createCrudProvider<T extends { id: string }>(
  config: CrudConfig<T>,
  Context: React.Context<CrudContextValue<T> | undefined>
) {
  return function CrudProvider({ children, initialData }: CrudProviderProps<T>) {
    const [items, setItems] = useState<T[]>(initialData ?? []);

    const add = useCallback((item: Omit<T, 'id'>) => {
      const newItem = config.onBeforeAdd 
        ? config.onBeforeAdd(item)
        : { ...item, id: config.generateId() } as T;
      
      setItems((prev: T[]) => [...prev, newItem]);
      return newItem;
    }, [setItems]);

    const update = useCallback((id: string, updates: Partial<T>) => {
      setItems((prev: T[]) => prev.map((item: T) => {
        if (item.id !== id) return item;
        
        const finalUpdates = config.onBeforeUpdate
          ? config.onBeforeUpdate(id, updates, item)
          : updates;
        
        return { ...item, ...finalUpdates };
      }));
    }, [setItems]);

    const remove = useCallback((id: string) => {
      setItems((prev: T[]) => prev.filter((item: T) => item.id !== id));
    }, [setItems]);

    const getById = useCallback((id: string) => {
      return items.find((item: T) => item.id === id);
    }, [items]);

    const refresh = useCallback(() => {
      // Refresh is now a no-op since we don't use localStorage
      // Data should be fetched from backend API instead
    }, []);

    const value: CrudContextValue<T> = {
      items,
      add,
      update,
      remove,
      getById,
      refresh,
    };

    return <Context.Provider value={value}>{children}</Context.Provider>;
  };
}
