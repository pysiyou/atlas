#!/usr/bin/env node
/**
 * Validate contracts/enums.json against enums.schema.json (AJV).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CONTRACTS = path.join(ROOT, 'contracts');

if (fs.existsSync(path.join(CONTRACTS, 'enums-ui.json'))) {
  console.error('contracts/enums-ui.json must be removed — UI belongs in enums.json');
  process.exit(1);
}

const schema = JSON.parse(fs.readFileSync(path.join(CONTRACTS, 'enums.schema.json'), 'utf8'));
const data = JSON.parse(fs.readFileSync(path.join(CONTRACTS, 'enums.json'), 'utf8'));

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);
if (!validate(data)) {
  console.error('enums.json schema validation failed:');
  for (const err of validate.errors ?? []) {
    console.error(`  ${err.instancePath || '/'} ${err.message}`);
  }
  process.exit(1);
}

console.log('enums.json schema valid');
