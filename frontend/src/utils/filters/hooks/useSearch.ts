/**
 * useSearch Hook
 * Simple search-only filtering hook for basic search functionality
 * 
 * @example
 * ```typescript
 * const { filteredItems, searchQuery, setSearchQuery } = useSearch(
 *   items,
 *   (item, query) => item.name.toLowerCase().includes(query.toLowerCase())
 * );
 * ```
 */

import { useState, useMemo } from 'react';

/**
 * Simple search-only filtering hook
 * For cases where you just need search functionality
 */
export function useSearch<T>(items: T[], searchFn: (item: T, query: string) => boolean) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    return items.filter(item => searchFn(item, searchQuery));
  }, [items, searchQuery, searchFn]);

  return {
    filteredItems,
    searchQuery,
    setSearchQuery,
    isEmpty: filteredItems.length === 0,
  };
}
