/** Result flags, reference ranges, physiologic limits, and result tile styles. */
import type { ResultStatus } from '@/types/generated/enums';
import type { CatalogReferenceRange, CriticalRange, AnalyteDefinition, Patient, Gender } from '@/types';
import type { DemographicRange } from '@/types';
import { listReferenceRangeBands, resolveReferenceBand } from './referenceRange';
import { calculateAge } from '@/utils/string';
import { FG, TONE, metricTile, metricTileStateFromResult } from '@/theme/recipes';
export type { ResultStatus };

export interface PhysiologicLimit {
  min: number;
  max: number;
}

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

/** Build result key -> status from test.flags (`analyteCode:status`). */
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
): { resultValue: string; unit: string; referenceRange: string; status: ResultStatus } {
  const obj =
    typeof raw === 'object' && raw !== null && 'value' in (raw as object)
      ? (raw as { value: unknown; unit?: string; referenceRange?: string; status?: string })
      : null;
  const resultValue = obj ? String(obj.value) : String(raw);
  const unit = obj?.unit ?? '';
  const referenceRange = obj?.referenceRange?.trim() ?? '';
  const statusFromResult = obj?.status as ResultStatus | undefined;
  const status = flagStatusMap[key] ?? statusFromResult ?? 'normal';
  return { resultValue, unit, referenceRange, status };
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
  text?: string;
  source:
    | 'adult_male'
    | 'adult_female'
    | 'adult_general'
    | 'pediatric'
    | 'legacy'
    | 'none';
}

export function getPatientSpecificRange(
  catalogRange: CatalogReferenceRange,
  patient?: Patient | { gender?: Gender; age?: number; dateOfBirth?: string; smoker?: boolean }
): ReferenceRangeDisplay {
  let age: number | undefined;
  if (patient) {
    if ('age' in patient && patient.age !== undefined) age = patient.age;
    else if ('dateOfBirth' in patient && patient.dateOfBirth) age = calculateAge(patient.dateOfBirth);
  }
  const resolved = resolveReferenceBand(catalogRange, patient, age);
  const { source, bandKey: _bandKey, ...bounds } = resolved;
  return { ...bounds, source };
}

export function isCriticalValue(value: number, criticalRange?: CriticalRange): boolean {
  if (!criticalRange) return false;
  if (criticalRange.low !== undefined && value < criticalRange.low) return true;
  if (criticalRange.high !== undefined && value > criticalRange.high) return true;
  return false;
}

export function checkReferenceRangeWithDemographics(
  value: number,
  analyte: AnalyteDefinition,
  patient?: Patient | { gender?: Gender; age?: number }
): ResultStatus {
  const crit = analyte.critical_range as CriticalRange | null | undefined;
  if (crit?.low !== undefined && value < crit.low) return 'critical';
  if (crit?.high !== undefined && value > crit.high) return 'critical';
  const catalog = analyte.reference_range as CatalogReferenceRange | null | undefined;
  if (catalog) {
    const range = getPatientSpecificRange(catalog, patient);
    if (range.low !== undefined && value < range.low) return 'low';
    if (range.high !== undefined && value > range.high) return 'high';
    return 'normal';
  }
  return 'normal';
}

function formatRangeBounds(low: number, high: number): string {
  return `${low} - ${high}`;
}

/** Display spacing for stored / legacy range strings (e.g. `3.5-11` → `3.5 - 11`). */
export function normalizeReferenceRangeDisplay(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '—') return trimmed;
  return trimmed
    .replace(/^<\s*/, '< ')
    .replace(/^>\s*/, '> ')
    .replace(/(\d(?:\.\d+)?)\s*-\s*(\d(?:\.\d+)?)/g, '$1 - $2');
}

function formatDemographicRangeSegment(range?: DemographicRange): string {
  if (!range) return '';
  if (range.text?.trim()) return range.text.trim();
  if (range.low !== undefined && range.high !== undefined) {
    return formatRangeBounds(range.low, range.high);
  }
  if (range.low !== undefined) return `> ${range.low}`;
  if (range.high !== undefined) return `< ${range.high}`;
  return '';
}

export type ReferenceIntervalLine = { label?: string; value: string };

function singleReferenceLine(value: string): ReferenceIntervalLine[] {
  const trimmed = normalizeReferenceRangeDisplay(value);
  return trimmed ? [{ value: trimmed }] : [{ value: '—' }];
}

export type ReferenceIntervalDisplay = 'resolved' | 'all_catalog_bands';

const SEX_LABEL_REF =
  /^(male|female|general|pediatric)\s*:\s*(.+)$/i;

/** Split stored HL7-style refs: `Male: <17 …; female: <25 …` into stacked report lines. */
export function parseSexLabeledReferenceLines(
  raw: string
): ReferenceIntervalLine[] | null {
  const trimmed = raw.trim();
  if (!trimmed.includes(';')) return null;
  const parts = trimmed.split(/\s*;\s*/).filter(Boolean);
  if (parts.length < 2) return null;
  const lines: ReferenceIntervalLine[] = [];
  for (const part of parts) {
    const match = part.match(SEX_LABEL_REF);
    if (!match) return null;
    lines.push({
      label: `${match[1].toLowerCase()}:`,
      value: match[2].trim(),
    });
  }
  return lines.length >= 2 ? lines : null;
}

function getAllCatalogReferenceIntervalLines(
  catalog: CatalogReferenceRange
): ReferenceIntervalLine[] {
  const bands = listReferenceRangeBands(catalog);
  if (bands.length === 0) return [];

  if (bands.length === 1) {
    const segment = formatDemographicRangeSegment(bands[0].range) || '—';
    const parsed = parseSexLabeledReferenceLines(segment);
    if (parsed) return parsed;
    return [{ value: segment }];
  }

  return bands.map(b => {
    const segment = formatDemographicRangeSegment(b.range) || '—';
    return { label: `${b.label.toLowerCase()}:`, value: segment };
  });
}

/** One physical line for layout width (PDF / column sizing). */
export function referenceIntervalLineText(line: ReferenceIntervalLine): string {
  if (line.label?.trim()) {
    return `${line.label} ${line.value}`;
  }
  return line.value;
}

/** Reference interval column — `resolved` (lab entry) or `all_catalog_bands` (reports). */
export function getAnalyteReferenceIntervalLines(
  analyte?: AnalyteDefinition,
  storedReferenceRange?: string,
  patient?: Patient | { gender?: Gender; age?: number; dateOfBirth?: string },
  display: ReferenceIntervalDisplay = 'resolved'
): ReferenceIntervalLine[] {
  const catalog = analyte?.reference_range as CatalogReferenceRange | null | undefined;
  if (catalog) {
    if (display === 'all_catalog_bands') {
      const lines = getAllCatalogReferenceIntervalLines(catalog);
      if (lines.length > 0) return lines;
    }
    const resolved = formatReferenceRange(catalog, patient);
    if (resolved !== 'N/A') return singleReferenceLine(resolved);
  }

  const fallback = storedReferenceRange?.trim();
  if (fallback && display === 'all_catalog_bands') {
    const parsed = parseSexLabeledReferenceLines(fallback);
    if (parsed) return parsed;
  }
  return singleReferenceLine(fallback || '—');
}

export function formatReferenceRange(
  range: CatalogReferenceRange | ReferenceRangeDisplay,
  demographics?: { gender?: Gender; age?: number; dateOfBirth?: string }
): string {
  if ('source' in range && range.source !== 'none') {
    const display = range as ReferenceRangeDisplay;
    if (display.text?.trim()) return display.text.trim();
    if (display.low !== undefined && display.high !== undefined) {
      return formatRangeBounds(display.low, display.high);
    }
    if (display.low !== undefined) return `> ${display.low}`;
    if (display.high !== undefined) return `< ${display.high}`;
    return 'N/A';
  }
  if ('adult_general' in range || 'adult_male' in range || 'adult_female' in range) {
    const catalogRange = range as CatalogReferenceRange;
    const resolved = getPatientSpecificRange(catalogRange, demographics);
    if (resolved.text?.trim()) return resolved.text.trim();
    if (resolved.low !== undefined && resolved.high !== undefined) {
      return formatRangeBounds(resolved.low, resolved.high);
    }
    if (resolved.low !== undefined) return `> ${resolved.low}`;
    if (resolved.high !== undefined) return `< ${resolved.high}`;
  }
  return 'N/A';
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  limit?: PhysiologicLimit;
}

export function validatePhysiologicValue(
  value: string | number,
  limit: PhysiologicLimit | undefined
): ValidationResult {
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

export function resultTileStatusClass(status: ResultStatus, hasValue: boolean): string {
  return metricTile({
    state: metricTileStateFromResult(status, hasValue, s => isCritical(s as ResultStatus)),
  });
}

export function resultValueClass(status: ResultStatus): string {
  if (isCritical(status)) return TONE.danger.fg;
  if (status !== 'normal') return TONE.warning.fg;
  return FG.body;
}

export function resultStatusLabel(status: ResultStatus): string | null {
  if (status === 'normal') return null;
  if (isCritical(status)) return 'Critical';
  if (status === 'high' || status === 'critical-high') return 'High';
  if (status === 'low' || status === 'critical-low') return 'Low';
  return status;
}

