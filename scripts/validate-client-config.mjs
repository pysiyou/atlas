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

const files = [
  'client-config.minimal.json',
  'client-config.globex.json',
  'client-config.json',
];

let failed = false;
for (const name of files) {
  const filePath = path.join(configDir, name);
  if (!fs.existsSync(filePath)) {
    if (name === 'client-config.json') {
      console.log(`skip ${name} (optional local deployment file)`);
      continue;
    }
    console.error(`missing ${name}`);
    failed = true;
    continue;
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  delete data.$schema;
  if (!validate(data)) {
    console.error(`${name}:`, validate.errors);
    failed = true;
  } else {
    console.log(`ok ${name}`);
  }
}

process.exit(failed ? 1 : 0);