#!/usr/bin/env node
/**
 * Generate frontend/src/types/generated/audit.ts from contracts/audit-events.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const contractPath = path.join(root, 'contracts', 'audit-events.json');
const outPath = path.join(root, 'frontend', 'src', 'types', 'generated', 'audit.ts');
const pyAuditPath = path.join(root, 'backend', 'app', 'shared', 'generated', 'audit.py');

const data = JSON.parse(fs.readFileSync(contractPath, 'utf-8'));
const events = data.events;
const query = data.query;
if (!Array.isArray(events) || !query || typeof query !== 'object') {
  console.error('audit-events.json must have events[] and query');
  process.exit(1);
}

function jsonString(value) {
  return JSON.stringify(value);
}

const domainKinds = query.domainKinds ?? [];
const laboratorySubkinds = query.laboratorySubkinds ?? [];
const accessEventTypes = query.accessEventTypes ?? [];
const storedEventScopes = query.storedEventScopes ?? [];
const defaultStoredEventScope = query.defaultStoredEventScope ?? 'order';

const domainUnion = domainKinds.map(k => jsonString(k.id)).join(' | ');
const labKindUnion = laboratorySubkinds.map(k => jsonString(k.id)).join(' | ');
const storedScopeUnion = storedEventScopes.map(jsonString).join(' | ');
const subdomainValues = laboratorySubkinds.map(k => jsonString(k.subdomain)).join(',');

const kindOptions = [
  ...domainKinds.map(k => `  { id: ${jsonString(k.id)}, label: ${jsonString(k.label)} }`),
  ...laboratorySubkinds.map(k => `  { id: ${jsonString(k.id)}, label: ${jsonString(k.label)} }`),
].join(',\n');

const wires = events.map(e => e.wire);
const wireUnion = wires.map(jsonString).join(' | ');
const wiresArray = `[${wires.map(jsonString).join(',')}] as const`;

function formatDefinition(event) {
  const parts = [
    `wire: ${jsonString(event.wire)}`,
    `domain: ${jsonString(event.domain)}`,
    `domainLabel: ${jsonString(event.domainLabel)}`,
    `verbPhrase: ${jsonString(event.verbPhrase)}`,
  ];
  if (event.laboratorySubdomain) {
    parts.splice(2, 0, `laboratorySubdomain: ${jsonString(event.laboratorySubdomain)}`);
  }
  if (Array.isArray(event.headlineMetaKeys) && event.headlineMetaKeys.length > 0) {
    parts.push(`headlineMetaKeys: ${jsonString(event.headlineMetaKeys)}`);
  }
  if (event.leadingActor) {
    parts.push(`leadingActor: true`);
  }
  if (event.trailingActor) {
    parts.push(`trailingActor: ${jsonString(event.trailingActor)}`);
  }
  if (event.treatAsSystemActor) {
    parts.push(`treatAsSystemActor: true`);
  }
  return `  ${jsonString(event.wire)}: { ${parts.join(', ')} },`;
}

const definitionsBody = events.map(formatDefinition).join('\n');

const output = `/** GENERATED — DO NOT EDIT. Regenerate: npm run codegen:audit (contracts/audit-events.json) */

// =============================================================================
// taxonomy
// =============================================================================
export type EventLogDomain = ${domainUnion};

export type EventLogLaboratoryKindKey = ${labKindUnion};

export type EventLogKind = EventLogDomain | EventLogLaboratoryKindKey;

export type StoredEventScope = ${storedScopeUnion};

export type EventLogLaboratorySubdomain = (typeof LABORATORY_SUBDOMAIN_VALUES)[number];

export const LABORATORY_SUBDOMAIN_VALUES = [${subdomainValues}] as const;

export const EVENT_LOG_KIND_OPTIONS: { id: EventLogKind; label: string }[] = [
${kindOptions},
];

export const ACCESS_EVENT_TYPES = ${jsonString(accessEventTypes)} as const;

export const DEFAULT_STORED_EVENT_SCOPE = ${jsonString(defaultStoredEventScope)} as const;

// =============================================================================
// definitions
// =============================================================================
export type AuditEventWire = ${wireUnion};

export type TrailingActorPolicy = 'human' | 'never';

export interface AuditEventDefinition {
  wire: AuditEventWire;
  domain: string;
  laboratorySubdomain?: string;
  domainLabel: string;
  verbPhrase: string;
  headlineMetaKeys?: readonly string[];
  leadingActor?: boolean;
  trailingActor?: TrailingActorPolicy;
  treatAsSystemActor?: boolean;
}

export const AUDIT_EVENT_DEFINITIONS: Record<AuditEventWire, AuditEventDefinition> = {
${definitionsBody}
};

export const AUDIT_EVENT_WIRES = ${wiresArray};
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, output, 'utf-8');
console.log(`Wrote ${path.relative(root, outPath)} (${wires.length} wires)`);

function pyQuote(v) {
  return JSON.stringify(v);
}

function pyFrozenset(values) {
  const body = values.map(v => `        ${pyQuote(v)},`).join('\n');
  return `frozenset(\n    {\n${body}\n    }\n)`;
}

const prefixEntries = (query.storedScopeByEventPrefix ?? [])
  .map(row => `    (${pyQuote(row.prefix)}, ${pyQuote(row.scope)}),`)
  .join('\n');
const allKindIds = [...domainKinds.map(k => k.id), ...laboratorySubkinds.map(k => k.id)];

const pyAuditLines = [
  '"""',
  'Audit event catalog — GENERATED from contracts/audit-events.json. DO NOT EDIT.',
  '"""',
  'from __future__ import annotations',
  '',
  'import enum',
  '',
  '',
  'class EventType(str, enum.Enum):',
  '    """Dot-notation event taxonomy for LIS audit trail."""',
  '',
];
for (const event of events) {
  pyAuditLines.push(`    ${event.member} = ${pyQuote(event.wire)}`);
}
pyAuditLines.push(
  '',
  '# ── Query taxonomy ──────────────────────────────────────────────────────',
  '',
  `DOMAIN_KIND_IDS: frozenset[str] = ${pyFrozenset(domainKinds.map(k => k.id))}`,
  '',
  `LABORATORY_SUBKIND_PREFIXES: dict[str, str] = {`,
  ...laboratorySubkinds.map(
    k => `    ${pyQuote(k.id)}: ${pyQuote(k.eventTypePrefix)},`
  ),
  '}',
  '',
  `ACCESS_EVENT_TYPES: frozenset[str] = ${pyFrozenset(accessEventTypes)}`,
  '',
  `STORED_EVENT_SCOPES: frozenset[str] = ${pyFrozenset(storedEventScopes)}`,
  '',
  'STORED_SCOPE_BY_PREFIX: tuple[tuple[str, str], ...] = (',
  prefixEntries,
  ')',
  '',
  `DEFAULT_STORED_EVENT_SCOPE: str = ${pyQuote(defaultStoredEventScope)}`,
  '',
  `ALL_KIND_IDS: frozenset[str] = ${pyFrozenset(allKindIds)}`,
  '',
);
fs.mkdirSync(path.dirname(pyAuditPath), { recursive: true });
fs.writeFileSync(pyAuditPath, pyAuditLines.join('\n'), 'utf-8');
console.log(`Wrote ${path.relative(root, pyAuditPath)}`);
