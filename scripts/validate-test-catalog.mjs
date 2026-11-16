#!/usr/bin/env node
/**
 * Validate catalog contracts:
 * 1. Ajv Draft-07 compile of orderable-panels.json and test-catalog.json
 * 2. Referential check that each test.panels[] id exists in the panel registry
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'frontend', 'package.json'),
);
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const catalogDir = path.join(root, 'contracts', 'catalog');
const catalogPath = path.join(catalogDir, 'test-catalog.json');
const panelsPath = path.join(catalogDir, 'orderable-panels.json');
const catalogSchemaPath = path.join(catalogDir, 'test-catalog.schema.json');
const panelsSchemaPath = path.join(catalogDir, 'orderable-panels.schema.json');

/**
 * Load JSON from disk.
 *
 * @param {string} filePath Absolute path to a JSON file.
 * @returns {unknown}
 */
function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Compile a Draft-07 schema. Strip `$schema` so Ajv 8 does not switch dialects;
 * `$ref` JSON pointers still resolve `#/definitions/...`.
 *
 * @param {object} schema Parsed JSON Schema document.
 * @returns {(data: unknown) => boolean}
 */
function compileDraft07(schema) {
  const copy = { ...schema };
  delete copy.$schema;
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv.compile(copy);
}

/**
 * Validate an instance document against a compiled schema and print Ajv errors.
 *
 * @param {string} label File name for error output.
 * @param {(data: unknown) => boolean} validate Compiled Ajv validator.
 * @param {object} data Instance document (may include `$schema`).
 * @returns {number} Error count (0 when valid).
 */
function validateAgainstSchema(label, validate, data) {
  const instance = { ...data };
  delete instance.$schema;
  if (validate(instance)) {
    return 0;
  }
  console.error(`${label}:`, validate.errors);
  return 1;
}

const catalogSchema = readJson(catalogSchemaPath);
const panelsSchema = readJson(panelsSchemaPath);
const catalog = readJson(catalogPath);
const registry = readJson(panelsPath);

let errors = 0;
errors += validateAgainstSchema(
  'orderable-panels.json',
  compileDraft07(panelsSchema),
  registry,
);
errors += validateAgainstSchema(
  'test-catalog.json',
  compileDraft07(catalogSchema),
  catalog,
);

const validIds = new Set((registry.panels ?? []).map(p => p.id));

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
console.log('ok orderable-panels.json');
console.log('ok test-catalog.json');
console.log('test-catalog panel references OK');
