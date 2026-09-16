/**
 * Result flag/status helpers for entry, validation, and report display.
 */

import type { ResultStatus } from '@/types/enums';

export type { ResultStatus };

const ABNORMAL_STATUSES: ResultStatus[] = [
  'high',
  'low',
  'critical',
  'critical-high',
  'critical-low',
];

export function isCritical(s: ResultStatus): boolean {
  return s === 'critical' || s === 'critical-high' || s === 'critical-low';
}

/** Build result key -> status from test.flags (`itemCode:status`). */
export function statusMapFromFlags(flags: string[] | undefined): Record<string, ResultStatus> {
  const map: Record<string, ResultStatus> = {};
  if (!flags?.length) return map;
  const valid = new Set(ABNORMAL_STATUSES);
  for (const f of flags) {
    const i = f.indexOf(':');
    if (i === -1) continue;
    const key = f.slice(0, i).trim();
    const status = f
      .slice(i + 1)
      .trim()
      .toLowerCase() as ResultStatus;
    if (key && valid.has(status)) map[key] = status;
  }
  return map;
}

export function parseResultEntry(
  key: string,
  raw: unknown,
  flagStatusMap: Record<string, ResultStatus>
): { resultValue: string; unit: string; status: ResultStatus } {
  const obj =
    typeof raw === 'object' && raw !== null && 'value' in (raw as object)
      ? (raw as { value: unknown; unit?: string; status?: string })
      : null;
  const resultValue = obj ? String(obj.value) : String(raw);
  const unit = obj?.unit ?? '';
  const statusFromResult = obj?.status as ResultStatus | undefined;
  const status = flagStatusMap[key] ?? statusFromResult ?? 'normal';
  return { resultValue, unit, status };
}
