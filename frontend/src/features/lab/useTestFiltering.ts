import React from 'react';

// Test filtering hook
export const useTestFiltering = <T>(items: T[], searchFn: (item: T, query: string) => boolean) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredItems = items.filter(item => searchFn(item, searchQuery));
  const isEmpty = filteredItems.length === 0;

  return {
    filteredTests: filteredItems,
    filteredItems,
    searchQuery,
    setSearchQuery,
    isEmpty,
  };
};
