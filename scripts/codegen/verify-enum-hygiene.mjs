#!/usr/bin/env node
/**
 * Post-codegen checks — enum single-source-of-truth hygiene.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FRONTEND = path.join(ROOT, 'frontend/src');
const CONTRACTS = path.join(ROOT, 'contracts');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (
        full.includes(`${path.sep}types${path.sep}enums${path.sep}generated`) ||
        full.includes(`${path.sep}lib${path.sep}api${path.sep}types${path.sep}generated`)
      ) {
        continue;
      }
      walk(full, acc);
    } else if (/\.(ts|tsx)$/.test(ent.name)) {
      acc.push(full);
    }
  }
  return acc;
}

let failed = false;

function fail(msg) {
  console.error(msg);
  failed = true;
}

const orderTs = read('frontend/src/types/enums/generated/order.ts');
if (orderTs.includes('export const PAYMENT_METHOD_OPTIONS')) {
  fail('order.ts must not export PAYMENT_METHOD_OPTIONS (use types/payments.ts)');
}
if (!orderTs.includes('GENERATED from contracts/enums.json')) {
  fail('Generated enum TS must reference contracts/enums.json');
}

const catalogTs = read('frontend/src/types/enums/generated/container-catalog.ts');
if (!catalogTs.includes('GENERATED from contracts/container-catalog.json')) {
  fail('container-catalog.ts must be generated from contracts/container-catalog.json');
}
if (/export type ContainerType\s*=/.test(catalogTs) || /export type ContainerTopColor\s*=/.test(catalogTs)) {
  fail('container-catalog.ts must not alias ContainerType/ContainerTopColor to catalog ids');
}

const duplicateEnumPattern =
  /export type (RemedyType|QualityStage|OrderStatus|PaymentMethod|TestStatus)\s*=\s*['"]/;

for (const file of walk(FRONTEND)) {
  const rel = path.relative(FRONTEND, file);
  const text = fs.readFileSync(file, 'utf8');
  if (duplicateEnumPattern.test(text)) {
    fail(`Duplicate domain enum type in ${rel} — use @/types/enums`);
  }
}

if (failed) {
  process.exit(1);
}

console.log('enum hygiene checks passed');
