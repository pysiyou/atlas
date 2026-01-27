/**
 * Filter Appliers
 * Reusable functions for applying different types of filters to data arrays
 */

/**
 * Apply search filter across multiple fields
 *
 * @param items - Array of items to filter
 * @param query - Search query string
 * @param searchFields - Function that returns array of searchable field values for an item
 * @returns Filtered items array
 */
export function applySearchFilter<T>(
  items: T[],
  query: string,
  searchFields: (item: T) => string[]
): T[] {
  if (!query.trim()) return items;

  const lowerQuery = query.toLowerCase().trim();
  return items.filter(item => {
    const fields = searchFields(item);
    return fields.some(field => field.toLowerCase().includes(lowerQuery));
  });
}

/**
 * Apply multi-select filter (array inclusion check)
 *
 * @param items - Array of items to filter
 * @param values - Array of selected values
 * @param field - Field name to check
 * @returns Filtered items array
 */
export function applyMultiSelectFilter<T>(
  items: T[],
  values: string[],
  field: keyof T
): T[] {
  if (values.length === 0) return items;

  return items.filter(item => {
    const fieldValue = item[field];
    if (Array.isArray(fieldValue)) {
      return fieldValue.some(val => values.includes(String(val)));
    }
    return values.includes(String(fieldValue));
  });
}

/**
 * Apply single-select filter (exact match)
 *
 * @param items - Array of items to filter
 * @param value - Selected value
 * @param field - Field name to check
 * @returns Filtered items array
 */
export function applySingleSelectFilter<T>(
  items: T[],
  value: string | null | undefined,
  field: keyof T
): T[] {
  if (!value) return items;

  return items.filter(item => String(item[field]) === value);
}

/**
 * Apply date range filter
 *
 * @param items - Array of items to filter
 * @param range - Date range [start, end] or null
 * @param getDate - Function to extract date from item
 * @returns Filtered items array
 */
export function applyDateRangeFilter<T>(
  items: T[],
  range: [Date, Date] | null,
  getDate: (item: T) => Date | string | null | undefined
): T[] {
  if (!range) return items;

  const [start, end] = range;
  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);

  return items.filter(item => {
    const itemDate = getDate(item);
    if (!itemDate) return false;
    const date = new Date(itemDate);
    return date >= startDate && date <= endDate;
  });
}

/**
 * Apply numeric range filter (for price, age, etc.)
 *
 * @param items - Array of items to filter
 * @param range - Numeric range [min, max]
 * @param getValue - Function to extract numeric value from item
 * @param defaults - Default range values [defaultMin, defaultMax]
 * @returns Filtered items array
 */
export function applyNumericRangeFilter<T>(
  items: T[],
  range: [number, number],
  getValue: (item: T) => number | null | undefined,
  defaults: [number, number]
): T[] {
  const [min, max] = range;
  const [defaultMin, defaultMax] = defaults;

  // If range is at defaults, don't filter
  if (min === defaultMin && max === defaultMax) return items;

  return items.filter(item => {
    const value = getValue(item);
    if (value === null || value === undefined) return false;
    return value >= min && value <= max;
  });
}

/**
 * Apply age range filter (special case of numeric range with age calculation)
 *
 * @param items - Array of items to filter
 * @param range - Age range [minAge, maxAge]
 * @param getAge - Function to calculate age from item
 * @param defaults - Default age range [defaultMin, defaultMax]
 * @returns Filtered items array
 */
export function applyAgeRangeFilter<T>(
  items: T[],
  range: [number, number],
  getAge: (item: T) => number | null | undefined,
  defaults: [number, number]
): T[] {
  return applyNumericRangeFilter(items, range, getAge, defaults);
}
