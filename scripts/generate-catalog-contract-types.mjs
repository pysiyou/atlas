#!/usr/bin/env node
/**
 * Generate catalog wire types from contracts/*.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const contractsDir = path.join(root, 'contracts');
const analyteJson = path.join(contractsDir, 'analytes.json');
const testJson = path.join(contractsDir, 'orderable-tests.json');
const tsOut = path.join(root, 'frontend', 'src', 'types', 'generated', 'catalogContracts.ts');

const ts = `/** GENERATED — DO NOT EDIT. Regenerate: npm run codegen:catalog */
/**
 * Wire shapes from contracts/analytes.json and orderable-tests.json (snake_case).
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
}

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
}

export interface CatalogCollectionBlock {
  sample_type: string;
  container_types?: string[];
  container_top_colors?: string[];
  min_volume_ml?: number;
  optimal_volume_ml?: number;
  volume_description?: string;
  container_description?: string;
  fasting_required?: boolean;
  collection_notes?: string;
  rejection_criteria?: string[];
}

export interface CatalogOrderableTestEntry {
  test_code: string;
  name: string;
  category_slug: string;
  category_label: string;
  analytes: string[];
  collection: CatalogCollectionBlock;
  validation: CatalogValidationBlock;
  description?: string;
  loinc_code?: string;
  order_obs?: 'order' | 'observation' | 'both';
  turnaround_time_hours?: number;
  price?: number;
  methodology?: string;
  synonyms?: string[];
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  notes?: string;
}
`;

if (!fs.existsSync(analyteJson) || !fs.existsSync(testJson)) {
  console.error('Missing contracts/analytes.json or orderable-tests.json');
  process.exit(1);
}

fs.mkdirSync(path.dirname(tsOut), { recursive: true });
fs.writeFileSync(tsOut, ts);
console.log(`Wrote ${tsOut}`);