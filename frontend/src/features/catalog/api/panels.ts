/**
 * Orderable catalog panels — named bundles of member test codes.
 */
import { apiClient } from '@/lib/api';
import { expectArray } from '@/lib/api';
import { cacheConfig, queryKeys, useAuthQueryEnabled } from '@/lib/query';
import { useQuery } from '@tanstack/react-query';

export interface CatalogPanel {
  /** Registry id (`hepatitis_panel`), same as contract `orderable-panels.json`. */
  code: string;
  name: string;
  description?: string | null;
  memberTestCodes: string[];
  price: number | null;
  isActive: boolean;
}

export const panelAPI = {
  async list(activeOnly = true): Promise<CatalogPanel[]> {
    const rows = await apiClient.get<CatalogPanel[]>('/panels', {
      activeOnly: String(activeOnly),
    });
    return expectArray(rows, 'catalog panels');
  },
};

export function useCatalogPanels() {
  const enabled = useAuthQueryEnabled();
  const query = useQuery({
    queryKey: queryKeys.panels.list(),
    queryFn: () => panelAPI.list(true),
    enabled,
    ...cacheConfig.static,
  });
  return {
    panels: query.data ?? [],
    isLoading: query.isLoading,
  };
}
