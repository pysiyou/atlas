#!/usr/bin/env node
/**
 * One-shot: map test-catalog rejection criteria from legacy shapes to reason id strings.
 * Accepts { reason, domain }, { reasonId }, or already-flat strings.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const CONTRACTS = path.join(ROOT, 'contracts');

const registry = JSON.parse(fs.readFileSync(path.join(CONTRACTS, 'rejection-reasons.json'), 'utf8'));
const byLabelDomain = new Map(
  registry.reasons.map(r => [`${r.label}|${r.domain}`, r.id]),
);

function toReasonId(item) {
  if (typeof item === 'string') {
    return item.trim();
  }
  if (item && typeof item === 'object' && item.reasonId) {
    return item.reasonId;
  }
  const reason = typeof item === 'string' ? item : item?.reason;
  const domain =
    typeof item === 'object' && item?.domain ? item.domain : reason ? 'specimen' : null;
  if (!reason) {
    throw new Error('Invalid criterion item: ' + JSON.stringify(item));
  }
  const key = `${reason}|${domain}`;
  const id = byLabelDomain.get(key);
  if (!id) {
    throw new Error(`No registry id for catalog criterion: ${JSON.stringify({ reason, domain })}`);
  }
  return id;
}

function migrateList(list) {
  return (list ?? []).map(toReasonId);
}

const catalogPath = path.join(CONTRACTS, 'test-catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

for (const test of catalog.tests ?? []) {
  if (test.sample?.rejection_criteria) {
    test.sample.rejection_criteria = migrateList(test.sample.rejection_criteria);
  }
  if (test.validation_rejection_criteria) {
    test.validation_rejection_criteria = migrateList(test.validation_rejection_criteria);
  }
}

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
console.log('migrated test-catalog.json rejection criteria to reason id strings');
