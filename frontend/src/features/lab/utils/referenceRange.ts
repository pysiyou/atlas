/** Resolve catalog `reference_range` bands — SI demographic convention only. */
import type { CatalogReferenceRange, DemographicRange, Gender } from '@/types';

export type ReferenceBandSource =
  | 'pediatric'
  | 'adult_male'
  | 'adult_female'
  | 'adult_general'
  | 'legacy'
  | 'none';

export interface ResolvedDemographicRange extends DemographicRange {
  source: ReferenceBandSource;
  bandKey?: string;
}

const BAND_LABELS: Record<string, string> = {
  adult_general: 'General',
  adult_male: 'Male',
  adult_female: 'Female',
  pediatric: 'Pediatric',
};

function asDemographicRange(value: unknown): DemographicRange | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const row = value as DemographicRange;
  if (row.low !== undefined || row.high !== undefined || row.text?.trim()) return row;
  return undefined;
}

function pickBand(
  catalogRange: CatalogReferenceRange,
  bandKey: string
): DemographicRange | undefined {
  return asDemographicRange(catalogRange[bandKey as keyof CatalogReferenceRange]);
}

/**
 * Choose the reference band for flagging/display for a patient (SI demographics).
 */
export function resolveReferenceBand(
  catalogRange: CatalogReferenceRange | null | undefined,
  patient?: { gender?: Gender; age?: number; dateOfBirth?: string },
  ageOverride?: number
): ResolvedDemographicRange {
  if (!catalogRange || typeof catalogRange !== 'object') {
    return { source: 'none' };
  }

  const age = ageOverride ?? patient?.age;
  const gender = patient?.gender;

  if (age !== undefined && age < 18) {
    const pediatric = pickBand(catalogRange, 'pediatric');
    if (pediatric) return { ...pediatric, source: 'pediatric', bandKey: 'pediatric' };
  }

  if (gender === 'male') {
    const male = pickBand(catalogRange, 'adult_male');
    if (male) return { ...male, source: 'adult_male', bandKey: 'adult_male' };
  }

  if (gender === 'female') {
    const female = pickBand(catalogRange, 'adult_female');
    if (female) return { ...female, source: 'adult_female', bandKey: 'adult_female' };
  }

  const general = pickBand(catalogRange, 'adult_general');
  if (general) return { ...general, source: 'adult_general', bandKey: 'adult_general' };

  const legacy = catalogRange as CatalogReferenceRange & { low?: number; high?: number };
  if (legacy.low !== undefined || legacy.high !== undefined) {
    return { low: legacy.low, high: legacy.high, source: 'legacy', bandKey: 'legacy' };
  }

  return { source: 'none' };
}

/** Human-readable labels for each populated reference band (detail tables). */
export function listReferenceRangeBands(
  catalogRange: CatalogReferenceRange | null | undefined
): { label: string; bandKey: string; range: DemographicRange }[] {
  if (!catalogRange) return [];
  const rows: { label: string; bandKey: string; range: DemographicRange }[] = [];
  for (const [bandKey, label] of Object.entries(BAND_LABELS)) {
    const range = pickBand(catalogRange, bandKey);
    if (range) rows.push({ label, bandKey, range });
  }
  return rows;
}