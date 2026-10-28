/**
 * Derive catalog filter categories from contracts/test-catalog.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { CONTRACTS, readJson, writeFile } from './read-contract.mjs';

function titleCase(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function generateTestCatalogMeta() {
  const catalogPath = path.join(CONTRACTS, 'test-catalog.json');
  if (!fs.existsSync(catalogPath)) {
    console.log('skip test-catalog meta (no contracts/test-catalog.json)');
    return;
  }
  const data = readJson('test-catalog.json');
  const tests = data.tests ?? [];
  const categories = [
    ...new Set(
      tests
        .map(t => t.mapped_category)
        .filter(c => typeof c === 'string' && c.length > 0),
    ),
  ].sort();

  const configEntries = categories
    .map(c => `  ${JSON.stringify(c)}: { label: ${JSON.stringify(titleCase(c))}, color: ${JSON.stringify(c)} }`)
    .join(',\n');

  const ts = `/**
 * Test catalog categories — GENERATED from contracts/test-catalog.json. DO NOT EDIT.
 */
export const TEST_CATEGORY_VALUES = ${JSON.stringify(categories)} as const;

export type GeneratedTestCategory = (typeof TEST_CATEGORY_VALUES)[number];

export const TEST_CATEGORY_CONFIG: Record<
  GeneratedTestCategory,
  { label: string; color: string }
> = {
${configEntries},
};

export function getGeneratedCategoryLabel(category: string): string {
  const known = TEST_CATEGORY_CONFIG[category as GeneratedTestCategory];
  if (known) return known.label;
  return category.replace(/-/g, ' ').replace(/\\b\\w/g, char => char.toUpperCase());
}
`;

  writeFile('frontend/src/types/generated/catalogCategories.ts', ts);
}
