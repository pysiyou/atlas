/**
 * Array Formatting Utilities
 * Functions for formatting arrays and lists for display
 */

/**
 * Format an array into a comma-separated string
 * @param items - Array of items to format
 * @param maxItems - Maximum number of items to show before truncating (default: no limit)
 * @returns Comma-separated string
 */
export function formatArray(
  items: (string | number | undefined | null)[] | undefined | null,
  maxItems?: number
): string {
  if (!items || items.length === 0) return '';

  const validItems = items.filter((item): item is string | number => item != null);
  if (validItems.length === 0) return '';

  if (maxItems && validItems.length > maxItems) {
    const shown = validItems.slice(0, maxItems).join(', ');
    const remaining = validItems.length - maxItems;
    return `${shown} +${remaining} more`;
  }

  return validItems.join(', ');
}

/**
 * Format a list with proper pluralization
 * @param items - Array of items
 * @param singularLabel - Label for singular form (e.g., "test")
 * @param pluralLabel - Optional label for plural form (defaults to singularLabel + "s")
 * @returns Formatted string with count and label
 */
export function formatList(
  items: unknown[] | undefined | null,
  singularLabel: string,
  pluralLabel?: string
): string {
  if (!items || items.length === 0) return `0 ${pluralLabel || `${singularLabel}s`}`;

  const count = items.length;
  const label = count === 1 ? singularLabel : pluralLabel || `${singularLabel}s`;

  return `${count} ${label}`;
}

/**
 * Format a boolean value to "Yes" or "No"
 * @param value - Boolean value
 * @returns "Yes" or "No"
 */
export function formatBoolean(value: boolean | undefined | null): string {
  if (value === undefined || value === null) return 'N/A';
  return value ? 'Yes' : 'No';
}
