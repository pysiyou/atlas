/**
 * Build PHYSIOLOGIC_LIMITS from test-catalog result_items.physiologic_range.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, writeFile } from './read-contract.mjs';

const CATALOG_PATH = path.join(ROOT, 'backend/app/shared/contracts/test-catalog.json');

export function loadTestCatalog() {
  if (!fs.existsSync(CATALOG_PATH)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
}

/** Collect item_code → limit from catalog (first wins; ranges must match if duplicated). */
export function collectPhysiologicLimitsFromCatalog(catalog) {
  const limits = {};
  for (const test of catalog.tests ?? []) {
    for (const item of test.result_items ?? []) {
      const range = item.physiologic_range;
      if (!range || range.min === undefined || range.max === undefined) {
        continue;
      }
      const code = item.item_code;
      if (limits[code]) {
        if (limits[code].min !== range.min || limits[code].max !== range.max) {
          console.error(
            `test-catalog: conflicting physiologic_range for ${code} in ${test.test_code}`,
          );
          process.exit(1);
        }
        continue;
      }
      const entry = { min: range.min, max: range.max };
      if (item.unit) entry.unit = item.unit;
      if (item.item_name) entry.description = item.item_name;
      limits[code] = entry;
    }
  }
  return limits;
}

export function generatePhysiologicLimitsFromCatalog() {
  const catalog = loadTestCatalog();
  if (!catalog) {
    console.log('skip physiologic limits (test-catalog.json not found)');
    return;
  }
  const limits = collectPhysiologicLimitsFromCatalog(catalog);
  const keys = Object.keys(limits).sort();

  const pyEntries = keys
    .map(key => {
      const v = limits[key];
      const parts = [`'min': ${v.min}`, `'max': ${v.max}`];
      if (v.unit) parts.push(`'unit': ${JSON.stringify(v.unit)}`);
      if (v.description) parts.push(`'description': ${JSON.stringify(v.description)}`);
      return `    ${JSON.stringify(key)}: {${parts.join(', ')}}`;
    })
    .join(',\n');

  const py = `"""
Physiologic Limits — GENERATED from test-catalog.json result_items.physiologic_range. DO NOT EDIT.
"""
from typing import Dict, Any

PHYSIOLOGIC_LIMITS: Dict[str, Dict[str, Any]] = {
${pyEntries}
}
`;

  const tsEntries = keys
    .map(key => {
      const v = limits[key];
      const fields = [`min: ${v.min}`, `max: ${v.max}`];
      if (v.unit) fields.push(`unit: ${JSON.stringify(v.unit)}`);
      if (v.description) fields.push(`description: ${JSON.stringify(v.description)}`);
      return `  ${JSON.stringify(key)}: { ${fields.join(', ')} }`;
    })
    .join(',\n');

  const ts = `/**
 * Physiologic limits — GENERATED from test-catalog.json result_items.physiologic_range. DO NOT EDIT.
 */
export interface PhysiologicLimit {
  min: number;
  max: number;
  unit?: string;
  description?: string;
}

export const PHYSIOLOGIC_LIMITS: Record<string, PhysiologicLimit> = {
${tsEntries}
};
`;

  writeFile('backend/app/shared/contracts/physiologic_limits.py', py);
  writeFile('frontend/src/types/generated/physiologicLimits.ts', ts);
}

export { CATALOG_PATH };
