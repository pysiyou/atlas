/**
 * AJV validation for contracts/enums.json (called from generate.mjs).
 */
import fs from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv';
import { CONTRACTS, readJson } from './read-contract.mjs';

export function validateEnumsContract() {
  if (fs.existsSync(path.join(CONTRACTS, 'enums-ui.json'))) {
    console.error('contracts/enums-ui.json must be removed — UI belongs in enums.json');
    process.exit(1);
  }

  const schemaPath = path.join(CONTRACTS, 'enums.schema.json');
  if (!fs.existsSync(schemaPath)) {
    return;
  }

  if (!fs.existsSync(path.join(CONTRACTS, 'enums.json'))) {
    return;
  }

  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const data = readJson('enums.json');

  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  if (!validate(data)) {
    console.error('enums.json schema validation failed:');
    for (const err of validate.errors ?? []) {
      console.error(`  ${err.instancePath || '/'} ${err.message}`);
    }
    process.exit(1);
  }
}
