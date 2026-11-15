#!/usr/bin/env node
/**
 * Generate frontend ClientConfig types from config/client-config.schema.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'frontend', 'package.json'));
const { compile } = require('json-schema-to-typescript');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const schemaPath = path.join(root, 'config', 'client-config.schema.json');
const outPath = path.join(root, 'frontend', 'src', 'config', 'types.ts');

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

const bannerComment = `/** GENERATED — DO NOT EDIT. Source: config/client-config.schema.json */\n`;

const ts = await compile(schema, 'ClientConfigRoot', {
  bannerComment,
  additionalProperties: false,
  cwd: path.dirname(schemaPath),
  declareExternallyReferenced: true,
  format: true,
});

const withAlias = ts
  .replace(/export interface \w+/, 'export interface ClientConfig')
  .replace(/^export interface ClientConfig/m, 'export interface ClientConfig');

fs.writeFileSync(outPath, withAlias, 'utf8');
console.log(`Wrote ${path.relative(root, outPath)}`);