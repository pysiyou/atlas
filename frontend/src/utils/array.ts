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

export function formatBoolean(value: boolean | undefined | null): string {
  if (value === undefined || value === null) return 'N/A';
  return value ? 'Yes' : 'No';
}
