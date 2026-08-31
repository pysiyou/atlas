/**
 * Catalog Formatters
 * Pure formatting functions for catalog display
 */

/**
 * Format array to comma-separated string with fallback
 */
export const formatArrayWithFallback = (arr: string[] | undefined): string => {
  if (!arr || arr.length === 0) return '-';
  return arr.join(', ');
};

/**
 * Format boolean to Yes/No with fallback
 */
export const formatBooleanWithFallback = (val: boolean | undefined): string => {
  if (val === undefined) return '-';
  return val ? 'Yes' : 'No';
};

/**
 * Capitalize first letter
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
