#!/usr/bin/env node
/**
 * Atlas cross-stack codegen — generates Python and TypeScript from contracts/.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CONTRACTS = path.join(ROOT, 'contracts');

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(CONTRACTS, name), 'utf8'));
}

function writeFile(relPath, content) {
  const full = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  console.log('wrote', relPath);
}

function generateLabConstants() {
  const data = readJson('lab-constants.json');
  const py = `"""
Laboratory Constants — GENERATED from contracts/lab-constants.json. DO NOT EDIT.
"""
MAX_RETEST_ATTEMPTS = ${data.MAX_RETEST_ATTEMPTS}
MAX_RECOLLECTION_ATTEMPTS = ${data.MAX_RECOLLECTION_ATTEMPTS}
`;
  const ts = `/**
 * Lab constants — GENERATED from contracts/lab-constants.json. DO NOT EDIT.
 */
export const GENERATED_LAB_CONSTANTS = {
  MAX_RETEST_ATTEMPTS: ${data.MAX_RETEST_ATTEMPTS},
  MAX_RECOLLECTION_ATTEMPTS: ${data.MAX_RECOLLECTION_ATTEMPTS},
} as const;
`;
  writeFile('backend/app/data/lab_constants.py', py);
  writeFile('frontend/src/types/generated/labConstants.ts', ts);
}

function generatePhysiologicLimits() {
  const limits = readJson('physiologic-limits.json');
  const pyEntries = Object.entries(limits)
    .map(([key, v]) => {
      const parts = [`'min': ${v.min}`, `'max': ${v.max}`];
      if (v.unit) parts.push(`'unit': '${v.unit}'`);
      if (v.description) parts.push(`'description': '${v.description.replace(/'/g, "\\'")}'`);
      return `    '${key}': {${parts.join(', ')}}`;
    })
    .join(',\n');
  const py = `"""
Physiologic Limits — GENERATED from contracts/physiologic-limits.json. DO NOT EDIT.
"""
from typing import Dict, Any

PHYSIOLOGIC_LIMITS: Dict[str, Dict[str, Any]] = {
${pyEntries}
}
`;
  const tsEntries = Object.entries(limits)
    .map(([key, v]) => {
      const fields = [`min: ${v.min}`, `max: ${v.max}`];
      if (v.unit) fields.push(`unit: '${v.unit}'`);
      if (v.description) fields.push(`description: '${v.description.replace(/'/g, "\\'")}'`);
      return `  ${JSON.stringify(key)}: { ${fields.join(', ')} }`;
    })
    .join(',\n');
  const ts = `/**
 * Physiologic limits — GENERATED from contracts/physiologic-limits.json. DO NOT EDIT.
 */
export interface PhysiologicLimit {
  min: number;
  max: number;
  unit?: string;
  description?: string;
}

export const PHYSIOLOGIC_LIMITS: Record<string, PhysiologicLimit> = {
${tsEntries}
};
`;
  writeFile('backend/app/data/physiologic_limits.py', py);
  writeFile('frontend/src/types/generated/physiologicLimits.ts', ts);
}

function generateEnums() {
  const jsonPath = path.join(CONTRACTS, 'enums.json');
  if (!fs.existsSync(jsonPath)) {
    console.log('skip enums (contracts/enums.json not found)');
    return;
  }
  const enums = readJson('enums.json');
  const blocks = Object.entries(enums).map(([name, def]) => {
    const base = def.type === 'int' ? 'int, enum.Enum' : 'str, enum.Enum';
    const entries = Object.entries(def.values)
      .map(([k, v]) => `    ${k} = ${typeof v === 'string' ? JSON.stringify(v) : v}`)
      .join('\n');
    return `class ${name}(${base}):\n${entries}`;
  });
  const py = `"""
Enum types — GENERATED from contracts/enums.json. DO NOT EDIT.
"""
import enum


${blocks.join('\n\n')}
`;
  writeFile('backend/app/schemas/enums.py', py);
  generateFrontendEnums(enums);
}

const FRONTEND_ENUM_UI = {
  Relationship: {
    spouse: 'Spouse',
    parent: 'Parent',
    sibling: 'Sibling',
    child: 'Child',
    friend: 'Friend',
    other: 'Other',
  },
  AffiliationDuration: {
    6: '6 Months',
    12: '1 Year',
    24: '2 Years',
  },
};

function generateFrontendEnums(enums) {
  for (const [name, def] of Object.entries(enums)) {
    if (!FRONTEND_ENUM_UI[name]) continue;

    const values = Object.values(def.values);
    const constName =
      name === 'AffiliationDuration' ? 'AFFILIATION_DURATION' : name.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
    const valuesName = `${constName}_VALUES`;
    const configName = `${constName}_CONFIG`;
    const optionsName = `${constName}_OPTIONS`;
    const typeName = name === 'AffiliationDuration' ? 'AffiliationDuration' : name;
    const fileStem = name === 'AffiliationDuration' ? 'affiliation' : name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

    const valuesLiteral = values.map(v => (typeof v === 'string' ? JSON.stringify(v) : v)).join(', ');
    const configEntries = values
      .map(v => {
        const key = typeof v === 'string' ? v : v;
        const label = FRONTEND_ENUM_UI[name][key];
        const keyLiteral = typeof v === 'string' ? `${v}` : v;
        return `  ${JSON.stringify(keyLiteral)}: { label: ${JSON.stringify(label)} }`;
      })
      .join(',\n');

    const filterBlock =
      name === 'Relationship'
        ? `
export const RELATIONSHIP_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Relationships' },
  ...${optionsName},
];
`
        : '';

    const ts = `/** GENERATED — source: contracts/enums.json. DO NOT EDIT BY HAND. */
export const ${valuesName} = [${valuesLiteral}] as const;

export type ${typeName} = (typeof ${valuesName})[number];

export const ${configName}: Record<${typeName}, { label: string }> = {
${configEntries},
};

export const ${optionsName} = ${valuesName}.map(value => ({
  value,
  label: ${configName}[value].label,
}));
${filterBlock}`;
    writeFile(`frontend/src/types/enums/generated/${fileStem}.ts`, ts);
  }
}

generateLabConstants();
if (fs.existsSync(path.join(CONTRACTS, 'physiologic-limits.json'))) {
  generatePhysiologicLimits();
}
generateEnums();
console.log('codegen complete');
