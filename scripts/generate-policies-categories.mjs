#!/usr/bin/env node
/**
 * Refresh TEST_CATEGORY_* in policies.ts from contracts/orderable-tests.json slugs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const testsPath = path.join(root, 'contracts', 'orderable-tests.json');
const policiesPath = path.join(root, 'frontend', 'src', 'types', 'generated', 'policies.ts');

const doc = JSON.parse(fs.readFileSync(testsPath, 'utf8'));
/** @type {Map<string, string>} */
const labelBySlug = new Map();
for (const test of doc.tests ?? []) {
  const slug = test.category_slug;
  if (!slug) continue;
  if (!labelBySlug.has(slug)) {
    const label = test.category_label || slug;
    const short = String(label).split(' - ')[0].split(',')[0].trim();
    labelBySlug.set(slug, short);
  }
}

const slugs = [...labelBySlug.keys()].sort();
const valuesLine = slugs.map(s => JSON.stringify(s)).join(',');
const configLines = slugs
  .map(
    slug =>
      `  ${JSON.stringify(slug)}: { label: ${JSON.stringify(labelBySlug.get(slug))}, color: ${JSON.stringify(slug)} },`,
  )
  .join('\n');

const block = `// =============================================================================
// catalog-categories
// =============================================================================
export const TEST_CATEGORY_VALUES = [${valuesLine}] as const;

export type GeneratedTestCategory = (typeof TEST_CATEGORY_VALUES)[number];

export const TEST_CATEGORY_CONFIG: Record<
  GeneratedTestCategory,
  { label: string; color: string }
> = {
${configLines}
};

export function getGeneratedCategoryLabel(category: string): string {
  const known = TEST_CATEGORY_CONFIG[category as GeneratedTestCategory];
  if (known) return known.label;
  return category.replace(/-/g, ' ').replace(/\\b\\w/g, (char) => char.toUpperCase());
}
`;

let policies = fs.readFileSync(policiesPath, 'utf8');
const start = policies.indexOf('// =============================================================================\n// catalog-categories');
const end = policies.length;
if (start === -1) {
  console.error('policies.ts: catalog-categories section not found');
  process.exit(1);
}
policies = `${policies.slice(0, start)}${block}\n`;
fs.writeFileSync(policiesPath, policies);
console.log(`Updated TEST_CATEGORY_* (${slugs.length} slugs) in policies.ts`);