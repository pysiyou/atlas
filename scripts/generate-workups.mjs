#!/usr/bin/env node
/**
 * Generate workup display labels from contracts/workups.json (API holds full rows).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const workupsPath = path.join(root, 'contracts', 'workups.json');
const tsOut = path.join(root, 'frontend', 'src', 'types', 'generated', 'workups.ts');

const data = JSON.parse(fs.readFileSync(workupsPath, 'utf8'));
const workups = data.workups;
if (!Array.isArray(workups) || workups.length === 0) {
  console.error('workups.json must have a non-empty "workups" array');
  process.exit(1);
}

const ids = new Set();
const labels = {};
for (const workup of workups) {
  if (!workup.id || !workup.name) {
    console.error('Each workup requires id and name');
    process.exit(1);
  }
  if (ids.has(workup.id)) {
    console.error(`Duplicate workup id: ${workup.id}`);
    process.exit(1);
  }
  ids.add(workup.id);
  labels[workup.id] = workup.name;
}

const tsIds = workups.map(w => JSON.stringify(w.id)).join(' | ');
const labelLines = Object.entries(labels)
  .map(([id, name]) => `  ${JSON.stringify(id)}: ${JSON.stringify(name)},`)
  .join('\n');

const ts = `/** GENERATED — DO NOT EDIT. Regenerate: npm run codegen:workups */
/** Display labels only — list/detail data comes from GET /workups. */

export type WorkupId = ${tsIds};

export const WORKUP_LABEL_BY_ID: Record<WorkupId, string> = {
${labelLines}
};

export function isWorkupId(value: string): value is WorkupId {
  return Object.prototype.hasOwnProperty.call(WORKUP_LABEL_BY_ID, value);
}

export function resolveWorkupLabel(workupId: string): string {
  return WORKUP_LABEL_BY_ID[workupId as WorkupId] ?? workupId;
}
`;

fs.writeFileSync(tsOut, ts);
console.log(`Wrote ${tsOut}`);