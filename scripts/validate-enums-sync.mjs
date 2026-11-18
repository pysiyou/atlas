#!/usr/bin/env node
/**
 * Ensure contracts/enums.json container catalog matches generated enums.ts.
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

const order = enumsJson.containers?.order ?? [];
let errors = 0;
for (const id of order) {
  if (!enumsTs.includes(`"${id}"`)) {
    console.error(`enums.ts missing container id ${id} from enums.json`);
    errors += 1;
  }
}
if (errors > 0) {
  process.exit(1);
}
console.log('ok enums.json containers ↔ enums.ts');