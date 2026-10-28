import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LIB_DIR = path.dirname(fileURLToPath(import.meta.url));

/** Repo root (Atlas/). */
export const ROOT = path.resolve(LIB_DIR, '../../..');

/** Human-edited contract JSON directory. */
export const CONTRACTS = path.join(ROOT, 'contracts');

export function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(CONTRACTS, name), 'utf8'));
}

export function writeFile(relPath, content) {
  const full = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  console.log('wrote', relPath);
}

/** Domain enums from contracts/enums.json (excludes $schema). */
export function loadDomainEnums(raw = readJson('enums.json')) {
  const { $schema: _schema, ...enums } = raw;
  return enums;
}
