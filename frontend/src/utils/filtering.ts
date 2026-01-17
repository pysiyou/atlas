/**
 * Common Filtering Utilities
 * Reusable filtering functions to reduce code duplication
 */

/**
 * Create a generic search filter function
 * @param searchFields Function that extracts searchable fields from an item
 * @returns Filter function that checks if item matches query
 */
export const createSearchFilter = <T,>(
  searchFields: (item: T) => string[]
) => (item: T, query: string): boolean => {
  if (!query.trim()) return true;
  
  const lowerQuery = query.toLowerCase();
  const fields = searchFields(item);
  
  return fields.some(field => 
    field.toLowerCase().includes(lowerQuery)
  );
};

/**
 * Create a multi-field search filter
 * Searches across multiple fields with OR logic
 */
export const createMultiFieldFilter = <T,>(
  fields: Array<keyof T>
) => (item: T, query: string): boolean => {
  if (!query.trim()) return true;
  
  const lowerQuery = query.toLowerCase();
  
  return fields.some(field => {
    const value = item[field];
    if (typeof value === 'string') {
      return value.toLowerCase().includes(lowerQuery);
    }
    if (typeof value === 'number') {
      return value.toString().includes(query);
    }
    return false;
  });
};

/**
 * Create a date range filter
 */
export const createDateRangeFilter = <T,>(
  dateField: keyof T
) => (item: T, startDate?: Date, endDate?: Date): boolean => {
  const value = item[dateField];
  
  if (!(value instanceof Date) && typeof value !== 'string') {
    return true;
  }
  
  const itemDate = value instanceof Date ? value : new Date(value);
  
  if (startDate && itemDate < startDate) return false;
  if (endDate && itemDate > endDate) return false;
  
  return true;
};

/**
 * Create a status filter
 */
export const createStatusFilter = <T, S extends string>(
  statusField: keyof T
) => (item: T, allowedStatuses: S[]): boolean => {
  if (allowedStatuses.length === 0) return true;
  
  const status = item[statusField];
  return allowedStatuses.includes(status as S);
};

/**
 * Combine multiple filters with AND logic
 */
export const combineFilters = <T,>(
  ...filters: Array<(item: T) => boolean>
) => (item: T): boolean => {
  return filters.every(filter => filter(item));
};

/**
 * Filter array by multiple criteria
 */
export const filterByMultipleCriteria = <T,>(
  items: T[],
  criteria: Array<(item: T) => boolean>
): T[] => {
  return items.filter(item => criteria.every(criterion => criterion(item)));
};
