#!/usr/bin/env node
/**
 * Generate rejection registry contracts for backend (Python) and frontend (TypeScript).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const regDir = path.join(root, 'contracts', 'registries');
const samplePath = path.join(regDir, 'sample-rejection-reasons.json');
const resultPath = path.join(regDir, 'result-rejection-reasons.json');
const pyOut = path.join(root, 'backend', 'app', 'shared', 'contracts', 'rejection_reasons.py');
const tsOut = path.join(root, 'frontend', 'src', 'types', 'generated', 'rejectionReasons.ts');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const sample = fs.existsSync(samplePath) ? readJson(samplePath) : { reasons: [] };
const result = fs.existsSync(resultPath) ? readJson(resultPath) : { reasons: [] };

/** @type {Map<string, { label: string; domain: 'specimen' | 'analytical' }>} */
const byId = new Map();

for (const row of sample.reasons ?? []) {
  if (row?.id && row?.label) {
    byId.set(row.id, { label: row.label, domain: 'specimen' });
  }
}
for (const row of result.reasons ?? []) {
  if (row?.id && row?.label) {
    byId.set(row.id, { label: row.label, domain: 'analytical' });
  }
}

const ids = [...byId.keys()].sort();

function pyDict(name, fn) {
  const lines = ids.map(id => `    ${JSON.stringify(id)}: ${fn(id)},`);
  return `${name}: dict[str, str] = {\n${lines.join('\n')}\n}`;
}

const py = `"""
Rejection reason registry — GENERATED from contracts/registries/sample-rejection-reasons.json
and result-rejection-reasons.json. DO NOT EDIT.
"""
from __future__ import annotations

${pyDict('REJECTION_REASON_BY_ID', id => JSON.stringify(byId.get(id).label))}

REJECTION_REASON_LABELS: frozenset[str] = frozenset(REJECTION_REASON_BY_ID.values())

${pyDict('REJECTION_REASON_DOMAIN_BY_ID', id => JSON.stringify(byId.get(id).domain))}

SPECIMEN_REASON_IDS: frozenset[str] = frozenset(
    {
${ids
  .filter(id => byId.get(id).domain === 'specimen')
  .map(id => `        ${JSON.stringify(id)},`)
  .join('\n')}
    }
)

_ID_BY_LABEL: dict[str, str] = {label: rid for rid, label in REJECTION_REASON_BY_ID.items()}


def resolve_rejection_reason_label(value: str) -> str:
    """Resolve registry id or canonical label to display label."""
    stripped = (value or "").strip()
    if not stripped:
        return stripped
    if stripped in REJECTION_REASON_BY_ID:
        return REJECTION_REASON_BY_ID[stripped]
    if stripped in REJECTION_REASON_LABELS:
        return stripped
    return stripped.replace("_", " ")


def rejection_reason_domain(value: str) -> str | None:
    """Return specimen | analytical for registry id or canonical label."""
    stripped = (value or "").strip()
    if not stripped:
        return None
    if stripped in REJECTION_REASON_DOMAIN_BY_ID:
        return REJECTION_REASON_DOMAIN_BY_ID[stripped]
    rid = _ID_BY_LABEL.get(stripped)
    if rid:
        return REJECTION_REASON_DOMAIN_BY_ID[rid]
    return None


def is_specimen_rejection_registry_value(value: str) -> bool:
    domain = rejection_reason_domain(value)
    return domain == "specimen"
`;

const tsReasonLines = ids
  .map(id => `  ${JSON.stringify(id)}: ${JSON.stringify(byId.get(id).label)},`)
  .join('\n');
const tsDomainLines = ids
  .map(
    id =>
      `  ${JSON.stringify(id)}: ${JSON.stringify(byId.get(id).domain)},`,
  )
  .join('\n');

const ts = `/** GENERATED — DO NOT EDIT. Regenerate: npm run codegen:rejection */

export const REJECTION_REASON_BY_ID: Readonly<Record<string, string>> = {
${tsReasonLines}
};

export const REJECTION_REASON_DOMAIN_BY_ID: Readonly<
  Record<string, 'specimen' | 'analytical'>
> = {
${tsDomainLines}
};

const LABEL_TO_ID: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(REJECTION_REASON_BY_ID).map(([id, label]) => [label, id]),
);

/** Resolve registry id or canonical label to display label. */
export function resolveRejectionReasonLabel(value: string | null | undefined): string {
  const stripped = (value ?? '').trim();
  if (!stripped) return stripped;
  if (REJECTION_REASON_BY_ID[stripped]) {
    return REJECTION_REASON_BY_ID[stripped];
  }
  if (LABEL_TO_ID[stripped] !== undefined) {
    return stripped;
  }
  return stripped.replace(/_/g, ' ');
}

export function rejectionReasonDomain(
  value: string,
): 'specimen' | 'analytical' | undefined {
  const stripped = value.trim();
  if (!stripped) return undefined;
  if (REJECTION_REASON_DOMAIN_BY_ID[stripped]) {
    return REJECTION_REASON_DOMAIN_BY_ID[stripped];
  }
  const id = LABEL_TO_ID[stripped];
  if (id) return REJECTION_REASON_DOMAIN_BY_ID[id];
  return undefined;
}
`;

fs.writeFileSync(pyOut, py);
fs.writeFileSync(tsOut, ts);
console.log(`Wrote ${pyOut} (${ids.length} ids)`);
console.log(`Wrote ${tsOut} (${ids.length} ids)`);