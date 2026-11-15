#!/usr/bin/env node
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
const configDir = path.join(__dirname, '..', 'config');
const schema = JSON.parse(
  fs.readFileSync(path.join(configDir, 'client-config.schema.json'), 'utf8'),
);
delete schema.$schema;

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

const filePath = path.join(configDir, 'client-config.json');
if (!fs.existsSync(filePath)) {
  console.error('missing client-config.json');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
delete data.$schema;

if (!validate(data)) {
  console.error('client-config.json:', validate.errors);
  process.exit(1);
}

console.log('ok client-config.json');