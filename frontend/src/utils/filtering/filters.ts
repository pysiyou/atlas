/**
 * Pure Filter Functions
 * Reusable filtering functions without React dependencies
 */

/**
 * Create a generic search filter function
 * @param searchFields Function that extracts searchable fields from an item
 * @returns Filter function that checks if item matches query
 * 
 * @example
 * ```typescript
 * const searchFilter = createSearchFilter<Patient>(
 *   (patient) => [patient.name, patient.email, patient.phone]
 * );
 * const matches = searchFilter(patient, 'john');
 * ```
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
 * 
 * @example
 * ```typescript
 * const filter = createMultiFieldFilter<Patient>(['name', 'email', 'phone']);
 * const matches = filter(patient, 'john');
 * ```
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
 * 
 * @example
 * ```typescript
 * const filter = createDateRangeFilter<Order>('orderDate');
 * const matches = filter(order, startDate, endDate);
 * ```
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
 * 
 * @example
 * ```typescript
 * const filter = createStatusFilter<Order, OrderStatus>('status');
 * const matches = filter(order, ['pending', 'processing']);
 * ```
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
 * 
 * @example
 * ```typescript
 * const combinedFilter = combineFilters(
 *   (item) => searchFilter(item, query),
 *   (item) => statusFilter(item, statuses),
 *   (item) => dateFilter(item, start, end)
 * );
 * const matches = combinedFilter(item);
 * ```
 */
export const combineFilters = <T,>(
  ...filters: Array<(item: T) => boolean>
) => (item: T): boolean => {
  return filters.every(filter => filter(item));
};

/**
 * Filter array by multiple criteria
 * 
 * @example
 * ```typescript
 * const filtered = filterByMultipleCriteria(items, [
 *   (item) => item.active,
 *   (item) => item.name.includes(query),
 * ]);
 * ```
 */
export const filterByMultipleCriteria = <T,>(
  items: T[],
  criteria: Array<(item: T) => boolean>
): T[] => {
  return items.filter(item => criteria.every(criterion => criterion(item)));
};

/**
 * Sort items by a field
 * 
 * @example
 * ```typescript
 * const sorted = sortItems(items, 'name', 'asc');
 * ```
 */
export const sortItems = <T,>(
  items: T[],
  field: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...items].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];

    let comparison = 0;
    if (aVal < bVal) comparison = -1;
    if (aVal > bVal) comparison = 1;

    return direction === 'desc' ? -comparison : comparison;
  });
};
