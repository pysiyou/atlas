#!/usr/bin/env node
/**
 * Generate catalog wire types from contracts/catalog JSON + schema.
 * Outputs: frontend/src/types/generated/catalogContracts.ts
 *          backend/app/shared/contracts/catalog_types.py
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const catalogDir = path.join(root, 'contracts', 'catalog');
const analyteJson = path.join(catalogDir, 'analyte-catalog.json');
const testJson = path.join(catalogDir, 'orderable-tests.json');
const tsOut = path.join(root, 'frontend', 'src', 'types', 'generated', 'catalogContracts.ts');
const pyOut = path.join(root, 'backend', 'app', 'shared', 'contracts', 'catalog_types.py');

const analyteDoc = JSON.parse(fs.readFileSync(analyteJson, 'utf-8'));
const testDoc = JSON.parse(fs.readFileSync(testJson, 'utf-8'));

/** @param {Record<string, unknown>[]} rows */
function collectKeys(rows) {
  const keys = new Set();
  for (const row of rows) {
    if (row && typeof row === 'object') {
      for (const k of Object.keys(row)) keys.add(k);
    }
  }
  return [...keys].sort();
}

const analyteKeys = collectKeys(analyteDoc.analytes ?? []);
const testKeys = collectKeys(testDoc.tests ?? []);

const ts = `/** GENERATED — DO NOT EDIT. Regenerate: npm run codegen:catalog */
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

/** One row in analyte-catalog.json (schema allows additional keys: ${analyteKeys.join(', ')}). */
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

/** One row in orderable-tests.json (schema allows additional keys: ${testKeys.join(', ')}). */
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
`;

const py = `"""
Catalog wire types — GENERATED from contracts/catalog. DO NOT EDIT.
Regenerate: npm run codegen:catalog
"""
from __future__ import annotations

from typing import Any, Literal, TypedDict


class CatalogDemographicRange(TypedDict, total=False):
    low: float
    high: float
    text: str


class CatalogReferenceRange(TypedDict, total=False):
    adult_general: CatalogDemographicRange
    adult_male: CatalogDemographicRange
    adult_female: CatalogDemographicRange
    pediatric: CatalogDemographicRange

class CatalogNumericRange(TypedDict, total=False):
    low: float
    high: float


class CatalogPhysiologicRange(TypedDict, total=False):
    min: float
    max: float


class CatalogValidationBlock(TypedDict, total=False):
    rejection_criteria: list[str]


CatalogValueType = Literal["NUMERIC", "SELECT", "TEXT"]

# Observed analyte keys: ${analyteKeys.join(', ')}
class CatalogAnalyteEntry(TypedDict, total=False):
    analyte_code: str
    name: str
    validation: CatalogValidationBlock
    loinc_code: str
    unit: str
    specimen: str
    value_type: CatalogValueType
    allowed_values: list[str]
    reference_range: CatalogReferenceRange
    critical_range: CatalogNumericRange
    physiologic_range: CatalogPhysiologicRange
    decimals_suggested: int
    citations: list[str]
    sample: dict[str, Any]


# Observed test keys: ${testKeys.join(', ')}
class CatalogOrderableTestEntry(TypedDict, total=False):
    test_code: str
    name: str
    test_category: str
    sample_type: str
    analytes: list[str]
    validation: CatalogValidationBlock
    price: float
    turnaround_time_hours: int
    synonyms: list[str]
    category: str
    method_common: str
    sample: dict[str, Any]
    sample_volume_description: str
    container_types: list[str]
    container_top_colors: list[str]
    loinc_code: str
    sources: list[str]
    confidence: str
    notes: str
    order_obs: str
    microbiology: dict[str, Any]
`;

fs.mkdirSync(path.dirname(tsOut), { recursive: true });
fs.writeFileSync(tsOut, ts);
fs.writeFileSync(pyOut, py);
console.log(`Wrote ${tsOut}`);
console.log(`Wrote ${pyOut}`);