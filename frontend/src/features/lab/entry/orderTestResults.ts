/**
 * Normalize order-test result payloads for entry draft seeding and display.
 */

function scalarResultValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'object' && value !== null && 'value' in value) {
    const nested = (value as { value: unknown }).value;
    return nested == null ? '' : String(nested);
  }
  return String(value);
}

/** Map API result record to string values keyed by parameter code. */
export function resultsFromOrderTest(
  results: Record<string, unknown> | undefined
): Record<string, string> {
  if (!results) return {};
  return Object.fromEntries(
    Object.entries(results).map(([key, value]) => [key, scalarResultValue(value)])
  );
}
