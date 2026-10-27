/**
 * Array & List Formatting Utilities
 */

export type TruncatedListPreview =
  | { kind: 'empty' }
  | { kind: 'all'; text: string }
  | { kind: 'more'; first: string; remaining: number };

export function normalizeTruncatedListItems(
  items: (string | number | undefined | null)[] | undefined | null,
): string[] {
  if (!items || items.length === 0) return [];
  return items
    .filter((item): item is string | number => item != null && String(item).trim() !== '')
    .map(item => String(item));
}

/** Table list preview: all items when there are at most two; otherwise first item + "+N more". */
export function getTruncatedListPreview(
  items: (string | number | undefined | null)[] | undefined | null,
): TruncatedListPreview {
  const validItems = normalizeTruncatedListItems(items);
  if (validItems.length === 0) return { kind: 'empty' };
  if (validItems.length <= 2) return { kind: 'all', text: validItems.join(', ') };
  return { kind: 'more', first: validItems[0], remaining: validItems.length - 1 };
}

export function formatTruncatedListPreview(
  items: (string | number | undefined | null)[] | undefined | null,
): string {
  const preview = getTruncatedListPreview(items);
  if (preview.kind === 'empty') return '';
  if (preview.kind === 'all') return preview.text;
  return `${preview.first}, +${preview.remaining} more`;
}

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
