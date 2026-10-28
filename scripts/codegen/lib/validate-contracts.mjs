/**
 * AJV validation for all contracts/*.json files that have a matching *.schema.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv';
import { CONTRACTS, readJson } from './read-contract.mjs';
import { validateEnumsContract } from './validate-enums.mjs';

const PAIRS = [
  ['lab.json', 'lab.schema.json'],
  ['feedback.json', 'feedback.schema.json'],
  ['audit-events.json', 'audit-events.schema.json'],
  ['rejection-reasons.json', 'rejection-reasons.schema.json'],
  ['test-catalog.json', 'test-catalog.schema.json'],
];

function validatePair(dataFile, schemaFile) {
  const dataPath = path.join(CONTRACTS, dataFile);
  const schemaPath = path.join(CONTRACTS, schemaFile);
  if (!fs.existsSync(dataPath)) {
    console.log(`skip validate ${dataFile} (not found)`);
    return;
  }
  if (!fs.existsSync(schemaPath)) {
    console.error(`Missing schema for ${dataFile}: expected ${schemaFile}`);
    process.exit(1);
  }
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const data = readJson(dataFile);
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  if (!validate(data)) {
    console.error(`${dataFile} schema validation failed:`);
    for (const err of validate.errors ?? []) {
      console.error(`  ${err.instancePath || '/'} ${err.message}`);
    }
    process.exit(1);
  }
  console.log(`validated ${dataFile}`);
}

export function validateAllContracts() {
  validateEnumsContract();
  for (const [dataFile, schemaFile] of PAIRS) {
    validatePair(dataFile, schemaFile);
  }
}
