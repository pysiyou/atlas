/**
 * Resolves catalog test codes to display names for event log headlines.
 */
import type { EventLogRecord } from './types';

export type TestNameLookup = (testCode: string) => string;

export function collectTestCodes(record: EventLogRecord): string[] {
  const meta = record.metadata ?? {};
  const rawList = meta.test_codes;
  if (Array.isArray(rawList)) {
    const codes = rawList
      .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
      .map(entry => entry.trim());
    if (codes.length > 0) return codes;
  }
  const single = meta.test_code;
  if (typeof single === 'string' && single.trim()) return [single.trim()];
  return [];
}

/** First test name, then ", +N" when multiple codes are present. */
export function formatTestNamesLabel(codes: string[], lookup: TestNameLookup): string {
  if (codes.length === 0) return '—';
  const names = codes.map(code => {
    const name = lookup(code).trim();
    if (name) return name;
    return code.toLowerCase();
  });
  const first = names[0];
  if (names.length === 1) return first;
  return `${first}, +${names.length - 1}`;
}
