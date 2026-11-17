#!/usr/bin/env node
/**
 * Generate clinical workup registry modules from contracts/catalog/clinical-workups.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const workupsPath = path.join(root, 'contracts', 'catalog', 'clinical-workups.json');
const pyOut = path.join(root, 'backend', 'app', 'shared', 'contracts', 'clinical_workups.py');
const tsOut = path.join(root, 'frontend', 'src', 'types', 'generated', 'clinicalWorkups.ts');

const data = JSON.parse(fs.readFileSync(workupsPath, 'utf-8'));
const workups = data.workups;
if (!Array.isArray(workups) || workups.length === 0) {
  console.error('clinical-workups.json must have a non-empty "workups" array');
  process.exit(1);
}

const ids = new Set();
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
}

function pyStr(value) {
  return JSON.stringify(value);
}

/**
 * @param {{ test_codes?: string[] }} workup
 * @returns {string}
 */
function pyTestCodes(workup) {
  const codes = Array.isArray(workup.test_codes) ? workup.test_codes : [];
  return `(${codes.map(c => pyStr(c)).join(', ')})`;
}

const pyEntries = workups
  .map(
    w =>
      `    ${pyStr(w.id)}: ClinicalWorkupDef(id=${pyStr(w.id)}, name=${pyStr(w.name)}, description=${pyStr(w.description ?? '')}, test_codes=${pyTestCodes(w)}),`,
  )
  .join('\n');

const pyIds = workups.map(w => pyStr(w.id)).join(', ');

const py = `"""
Clinical workup registry — GENERATED from contracts/catalog/clinical-workups.json. DO NOT EDIT.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class ClinicalWorkupDef:
    id: str
    name: str
    description: str
    test_codes: tuple[str, ...] = ()


CLINICAL_WORKUP_BY_ID: dict[str, ClinicalWorkupDef] = {
${pyEntries}
}

CLINICAL_WORKUP_IDS: frozenset[str] = frozenset((${pyIds}))


def is_clinical_workup_id(value: str) -> bool:
    return value in CLINICAL_WORKUP_BY_ID


def resolve_clinical_workup_label(workup_id: str) -> str:
    entry = CLINICAL_WORKUP_BY_ID.get(workup_id)
    return entry.name if entry else workup_id
`;

fs.writeFileSync(pyOut, py);

/**
 * @param {{ test_codes?: string[] }} workup
 * @returns {string}
 */
function tsTestCodesFragment(workup) {
  const codes = Array.isArray(workup.test_codes) ? workup.test_codes : [];
  if (codes.length === 0) {
    return '';
  }
  return `, test_codes: ${JSON.stringify(codes)}`;
}

const tsEntries = workups
  .map(
    w =>
      `  ${JSON.stringify(w.id)}: { id: ${JSON.stringify(w.id)}, name: ${JSON.stringify(w.name)}, description: ${JSON.stringify(w.description ?? '')}${tsTestCodesFragment(w)} },`,
  )
  .join('\n');

const tsIds = workups.map(w => JSON.stringify(w.id)).join(' | ');

const ts = `/** GENERATED — DO NOT EDIT. Regenerate: npm run codegen:workups */
export type ClinicalWorkupId = ${tsIds};

export interface ClinicalWorkupDef {
  id: ClinicalWorkupId;
  name: string;
  description: string;
  /** Orderable test mnemonics included in this workup. */
  test_codes?: string[];
}

export const CLINICAL_WORKUP_BY_ID: Record<ClinicalWorkupId, ClinicalWorkupDef> = {
${tsEntries}
};

export function isClinicalWorkupId(value: string): value is ClinicalWorkupId {
  return Object.prototype.hasOwnProperty.call(CLINICAL_WORKUP_BY_ID, value);
}

export function resolveClinicalWorkupLabel(workupId: string): string {
  const entry = CLINICAL_WORKUP_BY_ID[workupId as ClinicalWorkupId];
  return entry?.name ?? workupId;
}
`;

fs.writeFileSync(tsOut, ts);
console.log(`Wrote ${pyOut}`);
console.log(`Wrote ${tsOut}`);