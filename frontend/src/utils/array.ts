/**
 * Array & List Formatting Utilities
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
 * Formats an array into a comma-separated string with a configurable fallback.
 */
export function formatArrayWithFallback(
  items: (string | number | undefined | null)[] | undefined | null,
  fallback = ''
): string {
  const formatted = formatArray(items);
  return formatted || fallback;
}
