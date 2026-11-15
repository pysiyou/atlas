#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'frontend', 'package.json'),
);
const Ajv = require('ajv');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configDir = path.join(__dirname, '..', 'config');
const schema = JSON.parse(fs.readFileSync(path.join(configDir, 'ui-strings.schema.json'), 'utf8'));
delete schema.$schema;

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

const filePath = path.join(configDir, 'ui-strings.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
delete data.$schema;

if (!validate(data)) {
  console.error('ui-strings.json validation failed:');
  for (const err of validate.errors ?? []) {
    console.error(`  ${err.instancePath || '/'}: ${err.message}`);
  }
  process.exit(1);
}

console.log(`ok ${path.relative(path.join(__dirname, '..'), filePath)}`);