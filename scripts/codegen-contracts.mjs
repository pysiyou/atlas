#!/usr/bin/env node
/**
 * Orchestrate contract codegen and validation (catalog + registries).
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const steps = [
  ['node', ['validate-catalog.mjs']],
  ['node', ['generate-enums.mjs']],
  ['node', ['validate-enums-sync.mjs']],
  ['node', ['generate-rejection-reasons.mjs']],
  ['node', ['generate-catalog-contract-types.mjs']],
  ['node', ['generate-workups.mjs']],
  ['node', ['generate-policies-categories.mjs']],
  ['node', ['generate-feedback-catalog.mjs']],
  ['node', ['generate-audit-catalog.mjs']],
  ['node', ['generate-lab-policy.mjs']],
  ['node', ['generate-entity-ids.mjs']],
];

for (const [cmd, args] of steps) {
  const r = spawnSync(cmd, args, { cwd: __dirname, stdio: 'inherit' });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}
console.log('codegen-contracts: OK');