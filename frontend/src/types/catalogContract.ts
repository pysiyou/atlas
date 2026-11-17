/**
 * Wire shapes from contracts/catalog JSON files (snake_case keys).
 * Shared by catalog API mappers and result entry.
 */
import type { CatalogReferenceRange } from './domain/entities';

export type CatalogValueType = 'NUMERIC' | 'SELECT' | 'TEXT';

export interface CatalogAnalyteValidation {
  rejection_criteria: string[];
  [key: string]: unknown;
}

/** One row in contracts/catalog/analyte-catalog.json */
export interface CatalogAnalyteContract {
  analyte_code: string;
  name: string;
  loinc_code?: string;
  unit?: string;
  specimen?: string;
  value_type?: CatalogValueType;
  allowed_values?: string[];
  reference_range?: CatalogReferenceRange;
  critical_range?: { low?: number; high?: number };
  physiologic_range?: { min?: number; max?: number };
  decimals_suggested?: number;
  validation: CatalogAnalyteValidation;
  citations?: string[];
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

/** One row in contracts/catalog/orderable-tests.json */
export interface CatalogOrderableTestContract {
  test_code: string;
  name: string;
  test_category: string;
  sample_type: string;
  analytes: string[];
  validation: CatalogAnalyteValidation;
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