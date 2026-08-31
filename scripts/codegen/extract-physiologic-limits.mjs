#!/usr/bin/env node
/** One-time helper: extract PHYSIOLOGIC_LIMITS object from frontend TS into contracts JSON. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const src = fs.readFileSync(
  path.join(root, 'frontend/src/features/lab/utils/physiologicLimits.ts'),
  'utf8'
);
const start = src.indexOf('PHYSIOLOGIC_LIMITS: Record<string, PhysiologicLimit> = {');
const end = src.indexOf('\n};', start);
const body = src.slice(start + 'PHYSIOLOGIC_LIMITS: Record<string, PhysiologicLimit> = '.length, end + 1);
// eslint-disable-next-line no-new-func
const limits = new Function(`return ${body}`)();
fs.writeFileSync(
  path.join(root, 'contracts/physiologic-limits.json'),
  JSON.stringify(limits, null, 2)
);
console.log('Wrote contracts/physiologic-limits.json with', Object.keys(limits).length, 'entries');
