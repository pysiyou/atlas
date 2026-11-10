#!/usr/bin/env node
/**
 * Ensures worklist DTOs are not hand-redeclared in frontend/src/types/labWorklist.ts
 * (source of truth: labWorklistApi.ts → OpenAPI components).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT } from './lib/read-contract.mjs';

const LAB_WORKLIST = path.join(ROOT, 'frontend/src/types/labWorklist.ts');
const API_DTS = path.join(ROOT, 'frontend/src/lib/api/types/generated/api.d.ts');

const FORBIDDEN_PATTERNS = [
  /export\s+type\s+CollectionWorklistItem\s*=\s*WorklistRowMeta/,
  /export\s+type\s+EntryWorklistItem\s*=\s*WorklistRowMeta/,
  /export\s+interface\s+WorklistPagination\s*\{/,
  /export\s+interface\s+LabWorklistAllowedActions\s*\{/,
];

const REQUIRED_SCHEMAS = [
  'CollectionWorklistItem',
  'EntryWorklistItem',
  'ValidationWorklistItem',
  'DashboardWorklistItem',
  'WorklistPagination',
  'LabWorklistAllowedActions',
];

export function verifyWorklistTypes() {
  const worklistSrc = fs.readFileSync(LAB_WORKLIST, 'utf8');
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(worklistSrc)) {
      console.error(
        `verify-worklist-types: forbidden manual re-declaration in labWorklist.ts (pattern: ${pattern})`,
      );
      process.exit(1);
    }
  }

  if (!fs.existsSync(API_DTS)) {
    console.warn('verify-worklist-types: skip — api.d.ts missing (run codegen)');
    return;
  }

  const apiSrc = fs.readFileSync(API_DTS, 'utf8');
  for (const name of REQUIRED_SCHEMAS) {
    const needle = `/** ${name} */`;
    if (!apiSrc.includes(needle)) {
      console.error(`verify-worklist-types: missing OpenAPI schema ${name} in api.d.ts`);
      process.exit(1);
    }
  }

  console.log('verify-worklist-types: ok');
}

const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(scriptPath)) {
  verifyWorklistTypes();
}
