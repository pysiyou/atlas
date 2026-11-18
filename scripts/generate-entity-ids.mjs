#!/usr/bin/env node
/**
 * Sync ID regex patterns from contracts/entity-ids.json to frontend id.ts and backend utils.py.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const entityPath = path.join(root, 'contracts', 'entity-ids.json');
const tsIdPath = path.join(root, 'frontend', 'src', 'utils', 'id.ts');
const pyUtilsPath = path.join(root, 'backend', 'app', 'platform', 'utils.py');

const doc = JSON.parse(fs.readFileSync(entityPath, 'utf8'));
const patterns = doc.patterns ?? {};

// Build ID_PATTERNS block for id.ts
const idTs = fs.readFileSync(tsIdPath, 'utf8');
const patternBlock = Object.entries(patterns)
  .map(([, val]) => {
    const regexJs = val.regex.replace(/\\/g, '\\');
    return `  ${val.idTs}: /${regexJs}/,`;
  })
  .join('\n');

const updatedIdTs = idTs.replace(
  /export const ID_PATTERNS = \{[\s\S]*?\} as const;/,
  `export const ID_PATTERNS = {\n${patternBlock}\n} as const;`,
);
fs.writeFileSync(tsIdPath, updatedIdTs);

let py = fs.readFileSync(pyUtilsPath, 'utf8');
for (const [pyName, val] of Object.entries(patterns)) {
  const regexPy = val.regex.replace(/\\/g, '\\');
  const re = new RegExp(`${pyName} = r"[^"]*"`);
  if (re.test(py)) {
    py = py.replace(re, `${pyName} = r"${regexPy}"`);
  }
}
fs.writeFileSync(pyUtilsPath, py);
console.log('Synced entity id patterns (id.ts + utils.py)');