/** Result flags, reference ranges, physiologic limits, and result tile styles. */
import type { ResultStatus } from '@/types/enums';
import type { CatalogReferenceRange, CriticalRange, TestParameter, Patient, Gender } from '@/types';
import { calculateAge } from '@/utils/string';
import { PHYSIOLOGIC_LIMITS, type PhysiologicLimit } from '@/types/generated/physiologicLimits';
import { RADIUS, TONE, TYPE } from '@/components/theme/recipes';

export type { ResultStatus };
export { PHYSIOLOGIC_LIMITS, type PhysiologicLimit };

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

interface ParsedRange {
  min?: number;
  max?: number;
  type: 'range' | 'less-than' | 'greater-than' | 'text';
}

const parseReferenceRange = (range: string): ParsedRange => {
  if (range.startsWith('<')) return { max: parseFloat(range.slice(1)), type: 'less-than' };
  if (range.startsWith('>')) return { min: parseFloat(range.slice(1)), type: 'greater-than' };
  const rangeMatch = range.match(/^\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*$/);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    if (Number.isFinite(min) && Number.isFinite(max)) return { min, max, type: 'range' };
  }
  return { type: 'text' };
};

export const checkReferenceRange = (value: number, referenceRange: string): ResultStatus => {
  if (Number.isNaN(value)) return 'normal';
  const parsed = parseReferenceRange(referenceRange);
  if (parsed.type === 'text') return 'normal';
  if (parsed.type === 'less-than') {
    if (parsed.max === undefined || Number.isNaN(parsed.max)) return 'normal';
    return value < parsed.max ? 'normal' : 'high';
  }
  if (parsed.type === 'greater-than') {
    if (parsed.min === undefined || Number.isNaN(parsed.min)) return 'normal';
    return value > parsed.min ? 'normal' : 'low';
  }
  if (parsed.type === 'range') {
    if (parsed.min === undefined || parsed.max === undefined) return 'normal';
    if (value < parsed.min) return value < parsed.min * 0.5 ? 'critical' : 'low';
    if (value > parsed.max) return value > parsed.max * 1.5 ? 'critical' : 'high';
    return 'normal';
  }
  return 'normal';
};

export interface ReferenceRangeDisplay {
  low?: number;
  high?: number;
  source: 'adult_male' | 'adult_female' | 'adult_general' | 'pediatric' | 'none';
}

export function getPatientSpecificRange(
  catalogRange: CatalogReferenceRange,
  patient?: Patient | { gender?: Gender; age?: number; dateOfBirth?: string }
): ReferenceRangeDisplay {
  let age: number | undefined;
  if (patient) {
    if ('age' in patient && patient.age !== undefined) age = patient.age;
    else if ('dateOfBirth' in patient && patient.dateOfBirth) age = calculateAge(patient.dateOfBirth);
  }
  if (patient?.gender === 'male' && catalogRange.adult_male)
    return { ...catalogRange.adult_male, source: 'adult_male' };
  if (patient?.gender === 'female' && catalogRange.adult_female)
    return { ...catalogRange.adult_female, source: 'adult_female' };
  if (age !== undefined && age < 18 && catalogRange.pediatric)
    return { ...catalogRange.pediatric, source: 'pediatric' };
  if (catalogRange.adult_general) return { ...catalogRange.adult_general, source: 'adult_general' };
  return { source: 'none' };
}

export function isCriticalValue(value: number, criticalRange?: CriticalRange): boolean {
  if (!criticalRange) return false;
  if (criticalRange.low !== undefined && value < criticalRange.low) return true;
  if (criticalRange.high !== undefined && value > criticalRange.high) return true;
  return false;
}

export function checkReferenceRangeWithDemographics(
  value: number,
  parameter: TestParameter,
  patient?: Patient | { gender?: Gender; age?: number }
): ResultStatus {
  if (parameter.criticalLow !== undefined && value < parameter.criticalLow) return 'critical';
  if (parameter.criticalHigh !== undefined && value > parameter.criticalHigh) return 'critical';
  if (parameter.catalogReferenceRange) {
    const range = getPatientSpecificRange(parameter.catalogReferenceRange, patient);
    if (range.low !== undefined && value < range.low) return 'low';
    if (range.high !== undefined && value > range.high) return 'high';
    return 'normal';
  }
  return checkReferenceRange(value, parameter.referenceRange);
}

export function formatReferenceRange(
  range: CatalogReferenceRange | ReferenceRangeDisplay,
  demographics?: { gender?: Gender; age?: number; dateOfBirth?: string }
): string {
  if ('source' in range && range.source !== 'none') {
    if (range.low !== undefined && range.high !== undefined) return `${range.low}-${range.high}`;
    if (range.low !== undefined) return `>${range.low}`;
    if (range.high !== undefined) return `<${range.high}`;
    return 'N/A';
  }
  if ('adult_general' in range || 'adult_male' in range || 'adult_female' in range) {
    const resolved = getPatientSpecificRange(range as CatalogReferenceRange, demographics);
    if (resolved.low !== undefined && resolved.high !== undefined)
      return `${resolved.low}-${resolved.high}`;
    if (resolved.low !== undefined) return `>${resolved.low}`;
    if (resolved.high !== undefined) return `<${resolved.high}`;
  }
  return 'N/A';
}

/** Catalog item codes that differ from physiologic-limits contract keys (matches backend). */
const PHYSIOLOGIC_LIMIT_ALIASES: Record<string, string> = {
  PLAT: 'PLT',
};

export function getPhysiologicLimit(itemCode: string): PhysiologicLimit | undefined {
  const resolvedCode = PHYSIOLOGIC_LIMIT_ALIASES[itemCode] ?? itemCode;

  if (PHYSIOLOGIC_LIMITS[resolvedCode]) return PHYSIOLOGIC_LIMITS[resolvedCode];
  const upperCode = resolvedCode.toUpperCase();
  for (const [key, limit] of Object.entries(PHYSIOLOGIC_LIMITS)) {
    if (key.toUpperCase() === upperCode) return limit;
  }
  const resolvedLower = resolvedCode.toLowerCase();
  for (const [key, limit] of Object.entries(PHYSIOLOGIC_LIMITS)) {
    if (key.length < 3) continue;
    const keyLower = key.toLowerCase();
    if (keyLower.includes(resolvedLower) || resolvedLower.includes(keyLower)) return limit;
  }
  return undefined;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  limit?: PhysiologicLimit;
}

export function validatePhysiologicValue(
  itemCode: string,
  value: string | number
): ValidationResult {
  const limit = getPhysiologicLimit(itemCode);
  if (!limit) return { isValid: true };

  let numValue: number;
  if (typeof value === 'string') {
    numValue = parseFloat(value.replace(/^[<>]/, ''));
  } else {
    numValue = value;
  }

  if (Number.isNaN(numValue)) return { isValid: false, error: 'Value is not a valid number.', limit };
  if (numValue < limit.min)
    return {
      isValid: false,
      error: `Value ${numValue} is below physiologic minimum (${limit.min}). This value is not compatible with life.`,
      limit,
    };
  if (numValue > limit.max)
    return {
      isValid: false,
      error: `Value ${numValue} exceeds physiologic maximum (${limit.max}). This value is not compatible with life.`,
      limit,
    };
  return { isValid: true, limit };
}

export const RESULT_PANEL = {
  grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-3',
  tile:
    `${RADIUS.card} border px-space-3 py-space-2-5 flex flex-col gap-space-1-5 min-h-[4.5rem] transition-colors duration-150`,
  tileEmpty: 'border-border-subtle bg-surface-page/40',
  tileFilled: 'border-border-default bg-surface shadow-sm',
  label: 'text-xxs font-medium text-text-secondary truncate',
  value: 'text-lg font-medium tabular-nums leading-tight',
  unit: `${TYPE.meta} font-normal ml-space-1`,
  reference: `${TYPE.caption} leading-none font-normal truncate shrink-0 max-w-[50%]`,
  referenceUnavailable:
    '!text-xxs leading-none font-normal text-text-secondary truncate shrink-0 max-w-[50%]',
  notesSection: 'mt-space-4 pt-space-4 border-t border-border-subtle space-y-space-3',
  notesLabel: `${TYPE.label} font-normal`,
} as const;

export function resultTileStatusClass(status: ResultStatus, hasValue: boolean): string {
  if (!hasValue) return RESULT_PANEL.tileEmpty;
  if (isCritical(status)) {
    return `${TONE.danger.well} shadow-sm`;
  }
  if (status !== 'normal') {
    return `${TONE.warning.well} shadow-sm`;
  }
  return RESULT_PANEL.tileFilled;
}

export function resultValueClass(status: ResultStatus): string {
  if (isCritical(status)) return TONE.danger.fg;
  if (status !== 'normal') return TONE.warning.fg;
  return 'text-text-primary';
}

export function resultStatusLabel(status: ResultStatus): string | null {
  if (status === 'normal') return null;
  if (isCritical(status)) return 'Critical';
  if (status === 'high' || status === 'critical-high') return 'High';
  if (status === 'low' || status === 'critical-low') return 'Low';
  return status;
}

