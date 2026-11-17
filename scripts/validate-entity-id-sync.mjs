#!/usr/bin/env node
/**
 * Assert clinical ID regex contracts stay aligned across:
 * - contracts/registries/entity-ids.json (canonical)
 * - backend/app/platform/utils.py
 * - frontend/src/utils/id.ts (ID_PATTERNS)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const contractPath = path.join(root, 'contracts', 'registries', 'entity-ids.json');
const utilsPath = path.join(root, 'backend', 'app', 'platform', 'utils.py');
const idTsPath = path.join(root, 'frontend', 'src', 'utils', 'id.ts');

const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const utilsSource = fs.readFileSync(utilsPath, 'utf8');
const idTsSource = fs.readFileSync(idTsPath, 'utf8');

/** @type {string[]} */
const errors = [];

/**
 * @param {string} name e.g. MRN_PATTERN
 * @returns {string | null}
 */
function readPythonPattern(name) {
  const re = new RegExp(`${name}\\s*=\\s*r"([^"]+)"`);
  const match = utilsSource.match(re);
  return match ? match[1] : null;
}

/**
 * @param {string} key e.g. mrn
 * @returns {string | null}
 */
function readIdTsPattern(key) {
  const re = new RegExp(`\\b${key}:\\s*/([^/]+)/`);
  const match = idTsSource.match(re);
  return match ? match[1] : null;
}

for (const [constName, spec] of Object.entries(contract.patterns)) {
  const expected = spec.regex;
  const py = readPythonPattern(constName);
  if (py === null) {
    errors.push(`Missing ${constName} in ${utilsPath}`);
    continue;
  }
  if (py !== expected) {
    errors.push(
      `${constName} in utils.py (${py}) does not match contract (${expected})`,
    );
  }

  if (spec.idTs) {
    const ts = readIdTsPattern(spec.idTs);
    if (ts === null) {
      errors.push(`Missing ID_PATTERNS.${spec.idTs} in ${idTsPath}`);
    } else if (ts !== expected) {
      errors.push(
        `ID_PATTERNS.${spec.idTs} (${ts}) does not match contract (${expected})`,
      );
    }
  }
}

if (contract.analyzerUserId) {
  const analyzerRe = /ANALYZER_USER_ID\s*=\s*"([^"]+)"/;
  const constantsPath = path.join(
    root,
    'backend',
    'app',
    'domains',
    'lab',
    'constants.py',
  );
  const constantsSource = fs.readFileSync(constantsPath, 'utf8');
  const match = constantsSource.match(analyzerRe);
  if (!match || match[1] !== contract.analyzerUserId) {
    errors.push(
      `ANALYZER_USER_ID in constants.py must be "${contract.analyzerUserId}"`,
    );
  }
}

if (errors.length > 0) {
  console.error('Entity ID contract drift:\n');
  for (const e of errors) {
    console.error(`  - ${e}`);
  }
  process.exit(1);
}

console.log('Entity ID patterns: contract, utils.py, and id.ts are in sync.');