/**
 * contracts/rejection-reasons.json → rejection_reasons.py + rejectionReasonRegistry.ts
 * Cross-validates reasonId references in test-catalog.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv';
import { CONTRACTS, readJson, writeFile } from './read-contract.mjs';
import { loadDomainEnums } from './read-contract.mjs';

const SOURCE = 'contracts/rejection-reasons.json';

function loadRejectionReasonWires() {
  const enums = loadDomainEnums();
  const members = enums.RejectionReason?.members ?? {};
  return new Set(Object.values(members).map(m => m.wire));
}

function validateRegistrySchema(data) {
  const schemaPath = path.join(CONTRACTS, 'rejection-reasons.schema.json');
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  if (!validate(data)) {
    console.error('rejection-reasons.json schema validation failed:');
    for (const err of validate.errors ?? []) {
      console.error(`  ${err.instancePath || '/'} ${err.message}`);
    }
    process.exit(1);
  }
}

function validateRegistrySemantics(data) {
  const rejectionWires = loadRejectionReasonWires();
  const ids = new Set();
  const referencedInCatalog = collectCatalogReasonIds();

  for (const row of data.reasons ?? []) {
    if (ids.has(row.id)) {
      console.error('duplicate rejection reason id:', row.id);
      process.exit(1);
    }
    ids.add(row.id);

    if (row.legacyEnumWire && !rejectionWires.has(row.legacyEnumWire)) {
      console.error('invalid legacyEnumWire for id', row.id, ':', row.legacyEnumWire);
      process.exit(1);
    }
  }

  for (const reasonId of referencedInCatalog) {
    if (!ids.has(reasonId)) {
      console.error('test-catalog.json references unknown reasonId:', reasonId);
      process.exit(1);
    }
  }

  for (const row of data.reasons ?? []) {
    if (!referencedInCatalog.has(row.id)) {
      console.error('rejection reason id not referenced in test-catalog.json:', row.id);
      process.exit(1);
    }
  }
}

function collectCatalogReasonIds() {
  const catalogPath = path.join(CONTRACTS, 'test-catalog.json');
  if (!fs.existsSync(catalogPath)) {
    return new Set();
  }
  const catalog = readJson('test-catalog.json');
  const ids = new Set();

  function addCriterion(item, context) {
    if (typeof item === 'string') {
      if (item.trim()) ids.add(item.trim());
      return;
    }
    if (item && typeof item === 'object') {
      console.error(`legacy rejection criterion object in test-catalog (${context}):`, item);
      process.exit(1);
    }
    console.error(`invalid rejection criterion in test-catalog (${context}):`, item);
    process.exit(1);
  }

  for (const test of catalog.tests ?? []) {
    for (const item of test.sample?.rejection_criteria ?? []) {
      addCriterion(item, 'sample');
    }
    for (const item of test.validation_rejection_criteria ?? []) {
      addCriterion(item, 'validation');
    }
  }
  return ids;
}

function validateTestCatalogSchema() {
  const dataPath = path.join(CONTRACTS, 'test-catalog.json');
  const schemaPath = path.join(CONTRACTS, 'test-catalog.schema.json');
  if (!fs.existsSync(dataPath) || !fs.existsSync(schemaPath)) {
    return;
  }
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const data = readJson('test-catalog.json');
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  if (!validate(data)) {
    console.error('test-catalog.json schema validation failed:');
    for (const err of validate.errors ?? []) {
      console.error(`  ${err.instancePath || '/'} ${err.message}`);
    }
    process.exit(1);
  }
  console.log('validated test-catalog.json');
}

function generatePython(data) {
  const byId = {};
  const labels = {};
  const domains = {};
  const legacyWire = {};
  const specimenIds = [];

  for (const row of data.reasons) {
    byId[row.id] = row.label;
    labels[row.label] = row.label;
    domains[row.id] = row.domain;
    if (row.domain === 'specimen') {
      specimenIds.push(row.id);
    }
    if (row.legacyEnumWire) {
      legacyWire[row.id] = row.legacyEnumWire;
    }
  }

  const labelByIdEntries = Object.entries(byId)
    .map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
    .join('\n');

  const domainEntries = Object.entries(domains)
    .map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
    .join('\n');

  const specimenEntries = specimenIds.map(id => `        ${JSON.stringify(id)},`).join('\n');

  const legacyEntries = Object.entries(legacyWire)
    .map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
    .join('\n');

  const py = `"""
Rejection reason registry — GENERATED from ${SOURCE}. DO NOT EDIT.
"""
from __future__ import annotations

REJECTION_REASON_BY_ID: dict[str, str] = {
${labelByIdEntries}
}

REJECTION_REASON_LABELS: frozenset[str] = frozenset(REJECTION_REASON_BY_ID.values())

REJECTION_REASON_DOMAIN_BY_ID: dict[str, str] = {
${domainEntries}
}

SPECIMEN_REASON_IDS: frozenset[str] = frozenset(
    {
${specimenEntries}
    }
)

LEGACY_ENUM_WIRE_BY_ID: dict[str, str] = {
${legacyEntries}
}

_ID_BY_LABEL: dict[str, str] = {label: rid for rid, label in REJECTION_REASON_BY_ID.items()}


def resolve_rejection_reason_label(value: str) -> str:
    """Resolve registry id, canonical label, or legacy enum wire to display label."""
    stripped = (value or "").strip()
    if not stripped:
        return stripped
    if stripped in REJECTION_REASON_BY_ID:
        return REJECTION_REASON_BY_ID[stripped]
    if stripped in REJECTION_REASON_LABELS:
        return stripped
    for rid, wire in LEGACY_ENUM_WIRE_BY_ID.items():
        if stripped == wire:
            return REJECTION_REASON_BY_ID[rid]
    return stripped.replace("_", " ")


def rejection_reason_domain(value: str) -> str | None:
    """Return specimen | analytical for id, label, or legacy enum wire."""
    stripped = (value or "").strip()
    if not stripped:
        return None
    if stripped in REJECTION_REASON_DOMAIN_BY_ID:
        return REJECTION_REASON_DOMAIN_BY_ID[stripped]
    rid = _ID_BY_LABEL.get(stripped)
    if rid:
        return REJECTION_REASON_DOMAIN_BY_ID[rid]
    for rid, wire in LEGACY_ENUM_WIRE_BY_ID.items():
        if stripped == wire:
            return REJECTION_REASON_DOMAIN_BY_ID[rid]
    return None


def is_specimen_rejection_registry_value(value: str) -> bool:
    domain = rejection_reason_domain(value)
    return domain == "specimen"
`;

  writeFile('backend/app/shared/contracts/rejection_reasons.py', py);
}

function generateTypeScript(data) {
  const byId = {};
  const domainById = {};
  const legacyWire = {};
  const labelToId = {};

  for (const row of data.reasons) {
    byId[row.id] = row.label;
    domainById[row.id] = row.domain;
    labelToId[row.label] = row.id;
    if (row.legacyEnumWire) {
      legacyWire[row.id] = row.legacyEnumWire;
    }
  }

  const byIdEntries = Object.entries(byId)
    .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
    .join('\n');

  const domainEntries = Object.entries(domainById)
    .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
    .join('\n');

  const legacyEntries = Object.entries(legacyWire)
    .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
    .join('\n');

  const ts = `/**
 * Rejection reason registry — GENERATED from ${SOURCE}. DO NOT EDIT.
 */

export const REJECTION_REASON_BY_ID: Readonly<Record<string, string>> = {
${byIdEntries}
};

export const REJECTION_REASON_DOMAIN_BY_ID: Readonly<Record<string, 'specimen' | 'analytical'>> = {
${domainEntries}
};

export const LEGACY_ENUM_WIRE_BY_ID: Readonly<Record<string, string>> = {
${legacyEntries}
};

const LABEL_TO_ID: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(REJECTION_REASON_BY_ID).map(([id, label]) => [label, id]),
);

/** Resolve registry id, canonical label, or legacy enum wire to display label. */
export function resolveRejectionReasonLabel(value: string | null | undefined): string {
  const stripped = (value ?? '').trim();
  if (!stripped) return stripped;
  if (REJECTION_REASON_BY_ID[stripped]) {
    return REJECTION_REASON_BY_ID[stripped];
  }
  if (LABEL_TO_ID[stripped] !== undefined) {
    return stripped;
  }
  for (const [id, wire] of Object.entries(LEGACY_ENUM_WIRE_BY_ID)) {
    if (stripped === wire) {
      return REJECTION_REASON_BY_ID[id] ?? stripped;
    }
  }
  return stripped.replace(/_/g, ' ');
}

export function rejectionReasonDomain(value: string): 'specimen' | 'analytical' | undefined {
  const stripped = value.trim();
  if (!stripped) return undefined;
  if (REJECTION_REASON_DOMAIN_BY_ID[stripped]) {
    return REJECTION_REASON_DOMAIN_BY_ID[stripped];
  }
  const id = LABEL_TO_ID[stripped];
  if (id) return REJECTION_REASON_DOMAIN_BY_ID[id];
  for (const [rid, wire] of Object.entries(LEGACY_ENUM_WIRE_BY_ID)) {
    if (stripped === wire) {
      return REJECTION_REASON_DOMAIN_BY_ID[rid];
    }
  }
  return undefined;
}
`;

  writeFile('frontend/src/types/generated/rejectionReasonRegistry.ts', ts);
}

export function generateRejectionReasons() {
  const data = readJson('rejection-reasons.json');
  validateRegistrySchema(data);
  validateRegistrySemantics(data);
  validateTestCatalogSchema();
  generatePython(data);
  generateTypeScript(data);
}

export function validateRejectionReasonsPair() {
  validateRegistrySchema(readJson('rejection-reasons.json'));
  validateTestCatalogSchema();
}
