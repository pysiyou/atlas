#!/usr/bin/env node
/**
 * Ensure contracts/enums.json is reflected in generated enums.ts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const enumsJson = JSON.parse(fs.readFileSync(path.join(root, 'contracts', 'enums.json'), 'utf8'));
const enumsTs = fs.readFileSync(
  path.join(root, 'frontend', 'src', 'types', 'generated', 'enums.ts'),
  'utf8',
);

let errors = 0;

const containerOrder = enumsJson.containers?.order ?? [];
for (const id of containerOrder) {
  if (!enumsTs.includes(`"${id}"`)) {
    console.error(`enums.ts missing container id ${id} from enums.json`);
    errors += 1;
  }
}

const RESERVED = new Set(['$schema', 'containers']);
for (const [enumName, def] of Object.entries(enumsJson)) {
  if (RESERVED.has(enumName) || !def?.members) continue;
  const prefix = enumName.replace(/([a-z])([A-Z])/g, '$1_$2').replace(/-/g, '_').toUpperCase();
  const valuesMarker = `${prefix}_VALUES`;
  if (!enumsTs.includes(valuesMarker)) {
    console.error(`enums.ts missing ${valuesMarker} for ${enumName}`);
    errors += 1;
    continue;
  }
  for (const member of Object.values(def.members)) {
    const wire = member.wire;
    const token = typeof wire === 'number' ? String(wire) : `"${wire}"`;
    if (!enumsTs.includes(token)) {
      console.error(`enums.ts missing wire ${wire} for enum ${enumName}`);
      errors += 1;
    }
  }
}

if (errors > 0) {
  process.exit(1);
}
console.log('ok enums.json ↔ enums.ts');