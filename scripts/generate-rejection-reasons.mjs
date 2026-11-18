#!/usr/bin/env node
/**
 * Generate rejection registry contracts for backend (Python) and frontend (TypeScript).
 * Wire shape: id, code, label, domain (specimen | analytical) + domain-specific fields.
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

/** @typedef {'specimen' | 'analytical'} RejectionDomain */

/**
 * @typedef {{
 *   id: string;
 *   code: string;
 *   label: string;
 *   domain: RejectionDomain;
 * }} RejectionReasonRow
 */

const sample = fs.existsSync(samplePath) ? readJson(samplePath) : { reasons: [] };
const result = fs.existsSync(resultPath) ? readJson(resultPath) : { reasons: [] };

/** @type {Map<string, RejectionReasonRow>} */
const byId = new Map();

function ingest(rows, expectedDomain) {
  for (const row of rows ?? []) {
    if (!row?.id || !row?.label) continue;
    const domain = expectedDomain;
    if (byId.has(row.id)) {
      console.error(`duplicate rejection reason id: ${row.id}`);
      process.exit(1);
    }
    byId.set(row.id, {
      id: row.id,
      code: row.id,
      label: row.label,
      domain,
    });
  }
}

ingest(sample.reasons, 'specimen');
ingest(result.reasons, 'analytical');

const ids = [...byId.keys()].sort();

function pyDict(name, fn) {
  const lines = ids.map(id => `    ${JSON.stringify(id)}: ${fn(id)},`);
  return `${name}: dict[str, str] = {\n${lines.join('\n')}\n}`;
}

function pyReasonEntry(id) {
  const row = byId.get(id);
  return `{${[
    `"id": ${JSON.stringify(row.id)}`,
    `"code": ${JSON.stringify(row.code)}`,
    `"label": ${JSON.stringify(row.label)}`,
    `"domain": ${JSON.stringify(row.domain)}`,
  ].join(', ')}}`;
}

const py = `"""
Rejection reason registry — GENERATED from contracts/registries/sample-rejection-reasons.json
and result-rejection-reasons.json. DO NOT EDIT.

Each reason: id, code, label, domain (specimen | analytical).
"""
from __future__ import annotations

from typing import Literal, TypedDict

RejectionDomain = Literal["specimen", "analytical"]


class RejectionReasonDef(TypedDict):
    id: str
    code: str
    label: str
    domain: RejectionDomain


REJECTION_REASONS_BY_ID: dict[str, RejectionReasonDef] = {
${ids.map(id => `    ${JSON.stringify(id)}: ${pyReasonEntry(id)},`).join('\n')}
}

${pyDict('REJECTION_REASON_BY_ID', id => JSON.stringify(byId.get(id).label))}

REJECTION_REASON_LABELS: frozenset[str] = frozenset(REJECTION_REASON_BY_ID.values())

${pyDict('REJECTION_REASON_DOMAIN_BY_ID', id => JSON.stringify(byId.get(id).domain))}

SPECIMEN_REASON_IDS: frozenset[str] = frozenset(
    rid for rid, row in REJECTION_REASONS_BY_ID.items() if row["domain"] == "specimen"
)

ANALYTICAL_REASON_IDS: frozenset[str] = frozenset(
    rid for rid, row in REJECTION_REASONS_BY_ID.items() if row["domain"] == "analytical"
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

const tsDefLines = ids
  .map(id => {
    const row = byId.get(id);
    return `  ${JSON.stringify(id)}: ${JSON.stringify({
      id: row.id,
      code: row.code,
      label: row.label,
      domain: row.domain,
    })},`;
  })
  .join('\n');

const tsReasonLines = ids
  .map(id => `  ${JSON.stringify(id)}: ${JSON.stringify(byId.get(id).label)},`)
  .join('\n');
const tsDomainLines = ids
  .map(id => `  ${JSON.stringify(id)}: ${JSON.stringify(byId.get(id).domain)},`)
  .join('\n');

const ts = `/** GENERATED — DO NOT EDIT. Regenerate: npm run codegen:rejection */

export type RejectionDomain = 'specimen' | 'analytical';

export interface RejectionReasonDef {
  id: string;
  code: string;
  label: string;
  domain: RejectionDomain;
}

export const REJECTION_REASONS_BY_ID: Readonly<Record<string, RejectionReasonDef>> = {
${tsDefLines}
};

export const REJECTION_REASON_BY_ID: Readonly<Record<string, string>> = {
${tsReasonLines}
};

export const REJECTION_REASON_DOMAIN_BY_ID: Readonly<Record<string, RejectionDomain>> = {
${tsDomainLines}
};

export const SPECIMEN_REASON_IDS: ReadonlySet<string> = new Set(
  Object.entries(REJECTION_REASONS_BY_ID)
    .filter(([, row]) => row.domain === 'specimen')
    .map(([id]) => id),
);

export const ANALYTICAL_REASON_IDS: ReadonlySet<string> = new Set(
  Object.entries(REJECTION_REASONS_BY_ID)
    .filter(([, row]) => row.domain === 'analytical')
    .map(([id]) => id),
);

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
): RejectionDomain | undefined {
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