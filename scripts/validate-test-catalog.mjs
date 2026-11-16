#!/usr/bin/env node
/**
 * Validate test-catalog.json panel references against orderable-panels.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const catalogPath = path.join(root, 'contracts', 'test-catalog.json');
const panelsPath = path.join(root, 'contracts', 'orderable-panels.json');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
const registry = JSON.parse(fs.readFileSync(panelsPath, 'utf-8'));
const validIds = new Set((registry.panels ?? []).map(p => p.id));

let errors = 0;
for (const test of catalog.tests ?? []) {
  const code = test.test_code ?? '(unknown)';
  for (const panelId of test.panels ?? []) {
    if (typeof panelId !== 'string') {
      console.error(`${code}: panel entry must be a string id, got ${typeof panelId}`);
      errors += 1;
      continue;
    }
    if (!validIds.has(panelId)) {
      console.error(`${code}: unknown panel id "${panelId}"`);
      errors += 1;
    }
    if (panelId !== panelId.trim()) {
      console.error(`${code}: panel id must not have surrounding whitespace`);
      errors += 1;
    }
  }
}

if (errors > 0) {
  console.error(`test-catalog validation failed with ${errors} error(s)`);
  process.exit(1);
}
console.log('test-catalog panel references OK');