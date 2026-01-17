import { type ReactNode, useCallback } from 'react';
import { useLocalStorage } from '@/hooks';
import { loadFromLocalStorage } from '@/utils';

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
    const [items, setItems] = useLocalStorage<T[]>(config.storageKey, initialData ?? []);

    const add = useCallback((item: Omit<T, 'id'>) => {
      const newItem = config.onBeforeAdd 
        ? config.onBeforeAdd(item)
        : { ...item, id: config.generateId() } as T;
      
      setItems(prev => [...prev, newItem]);
      return newItem;
    }, [setItems]);

    const update = useCallback((id: string, updates: Partial<T>) => {
      setItems(prev => prev.map(item => {
        if (item.id !== id) return item;
        
        const finalUpdates = config.onBeforeUpdate
          ? config.onBeforeUpdate(id, updates, item)
          : updates;
        
        return { ...item, ...finalUpdates };
      }));
    }, [setItems]);

    const remove = useCallback((id: string) => {
      setItems(prev => prev.filter(item => item.id !== id));
    }, [setItems]);

    const getById = useCallback((id: string) => {
      return items.find(item => item.id === id);
    }, [items]);

    const refresh = useCallback(() => {
      const refreshedData = loadFromLocalStorage<T[]>(config.storageKey, []);
      setItems(refreshedData);
    }, [setItems]);

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
