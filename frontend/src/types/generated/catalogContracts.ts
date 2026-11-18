/** GENERATED — DO NOT EDIT. Regenerate: npm run codegen:catalog */
/**
 * Wire shapes from contracts/catalog/*.json (snake_case keys).
 * Shared with backend app.shared.contracts.catalog_types.
 */

export type CatalogValueType = 'NUMERIC' | 'SELECT' | 'TEXT';

export interface CatalogDemographicRange {
  low?: number;
  high?: number;
  text?: string;
}

export interface CatalogReferenceRange {
  adult_general?: CatalogDemographicRange;
  adult_male?: CatalogDemographicRange;
  adult_female?: CatalogDemographicRange;
  pediatric?: CatalogDemographicRange;
  low?: number;
  high?: number;
  [bandKey: string]: CatalogDemographicRange | number | undefined;
}

export interface CatalogNumericRange {
  low?: number;
  high?: number;
}

export interface CatalogPhysiologicRange {
  min?: number;
  max?: number;
}

export interface CatalogValidationBlock {
  rejection_criteria: string[];
  [key: string]: unknown;
}

/** One row in analyte-catalog.json (schema allows additional keys: allowed_values, analyte_code, citations, critical_range, decimals_suggested, loinc_code, name, physiologic_range, reference_range, specimen, unit, validation, value_type). */
export interface CatalogAnalyteEntry {
  analyte_code: string;
  name: string;
  validation: CatalogValidationBlock;
  loinc_code?: string;
  unit?: string;
  specimen?: string;
  value_type?: CatalogValueType;
  allowed_values?: string[];
  reference_range?: CatalogReferenceRange;
  critical_range?: CatalogNumericRange;
  physiologic_range?: CatalogPhysiologicRange;
  decimals_suggested?: number;
  citations?: string[];
  sample?: { rejection_criteria?: string[]; [key: string]: unknown };
  [key: string]: unknown;
}

export interface CatalogOrderableTestSample {
  sample_type?: string;
  container?: string;
  minimum_volume_ml?: number;
  fasting_required?: boolean;
  collection_notes?: string;
  rejection_criteria?: string[];
  [key: string]: unknown;
}

/** One row in orderable-tests.json (schema allows additional keys: analytes, category, confidence, container_top_colors, container_types, loinc_code, method_common, microbiology, name, notes, order_obs, price, sample, sample_type, sample_volume_description, sources, synonyms, test_category, test_code, turnaround_time_hours, validation). */
export interface CatalogOrderableTestEntry {
  test_code: string;
  name: string;
  test_category: string;
  sample_type: string;
  analytes: string[];
  validation: CatalogValidationBlock;
  price?: number;
  turnaround_time_hours?: number;
  synonyms?: string[];
  category?: string;
  method_common?: string;
  sample?: CatalogOrderableTestSample;
  sample_volume_description?: string;
  container_types?: string[];
  container_top_colors?: string[];
  loinc_code?: string;
  sources?: string[];
  confidence?: string;
  notes?: string;
  order_obs?: string;
  microbiology?: Record<string, unknown>;
  [key: string]: unknown;
}
