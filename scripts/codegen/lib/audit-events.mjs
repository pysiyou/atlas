/**
 * contracts/audit-events.json → audit_events.py + auditEventDefinitions.ts + taxonomy
 */
import Ajv from 'ajv';
import fs from 'node:fs';
import path from 'node:path';
import { CONTRACTS, readJson, ROOT, writeFile } from './read-contract.mjs';

function verifyAuditQueryTaxonomy(data) {
  const events = data.events ?? [];
  const wires = new Set(events.map(e => e.wire));
  const query = data.query;
  if (!query) {
    console.error('audit-events.json missing query section');
    process.exit(1);
  }

  for (const wire of query.accessEventTypes ?? []) {
    if (!wires.has(wire)) {
      console.error('query.accessEventType not in events:', wire);
      process.exit(1);
    }
  }

  const subkindBySubdomain = new Map(
    (query.laboratorySubkinds ?? []).map(s => [s.subdomain, s]),
  );

  for (const sub of query.laboratorySubkinds ?? []) {
    const expected = `laboratory.${sub.subdomain}.`;
    if (sub.eventTypePrefix !== expected) {
      console.error(
        `laboratorySubkind ${sub.id}: eventTypePrefix must be ${expected}, got ${sub.eventTypePrefix}`,
      );
      process.exit(1);
    }
  }

  const eventSubdomains = new Set(
    events.filter(e => e.laboratorySubdomain).map(e => e.laboratorySubdomain),
  );
  for (const subdomain of eventSubdomains) {
    if (!subkindBySubdomain.has(subdomain)) {
      console.error('event laboratorySubdomain missing laboratorySubkind row:', subdomain);
      process.exit(1);
    }
  }

  for (const scope of query.storedEventScopes ?? []) {
    if (scope === query.defaultStoredEventScope) {
      continue;
    }
    const inRules = (query.storedScopeByEventPrefix ?? []).some(r => r.scope === scope);
    if (!inRules) {
      console.error(
        `storedEventScopes entry ${scope} must appear in storedScopeByEventPrefix or be defaultStoredEventScope`,
      );
      process.exit(1);
    }
  }
}

function generateAuditTaxonomy(data) {
  const query = data.query;
  const domainKinds = query.domainKinds ?? [];
  const laboratorySubkinds = query.laboratorySubkinds ?? [];

  const domainIds = domainKinds.map(d => d.id);
  const subkindIds = laboratorySubkinds.map(s => s.id);
  const allKindIds = [...domainIds, ...subkindIds];

  const labPrefixEntries = laboratorySubkinds
    .map(s => `    ${JSON.stringify(s.id)}: ${JSON.stringify(s.eventTypePrefix)},`)
    .join('\n');

  const scopeRuleEntries = (query.storedScopeByEventPrefix ?? [])
    .map(r => `    (${JSON.stringify(r.prefix)}, ${JSON.stringify(r.scope)}),`)
    .join('\n');

  const py = `"""
Audit event log query taxonomy — GENERATED from contracts/audit-events.json. DO NOT EDIT.
"""
from __future__ import annotations

DOMAIN_KIND_IDS: frozenset[str] = frozenset(
    {
${domainIds.map(id => `        ${JSON.stringify(id)},`).join('\n')}
    }
)

LABORATORY_SUBKIND_PREFIXES: dict[str, str] = {
${labPrefixEntries}
}

ACCESS_EVENT_TYPES: frozenset[str] = frozenset(
    {
${(query.accessEventTypes ?? []).map(w => `        ${JSON.stringify(w)},`).join('\n')}
    }
)

STORED_EVENT_SCOPES: frozenset[str] = frozenset(
    {
${(query.storedEventScopes ?? []).map(s => `        ${JSON.stringify(s)},`).join('\n')}
    }
)

STORED_SCOPE_BY_PREFIX: tuple[tuple[str, str], ...] = (
${scopeRuleEntries}
)

DEFAULT_STORED_EVENT_SCOPE: str = ${JSON.stringify(query.defaultStoredEventScope ?? 'order')}

ALL_KIND_IDS: frozenset[str] = frozenset(
    {
${allKindIds.map(id => `        ${JSON.stringify(id)},`).join('\n')}
    }
)
`;

  writeFile('backend/app/shared/contracts/audit_taxonomy.py', py);

  const domainUnion = domainIds.map(id => JSON.stringify(id)).join(' | ') || 'string';
  const subkindUnion = subkindIds.map(id => JSON.stringify(id)).join(' | ') || 'never';
  const storedScopeUnion = (query.storedEventScopes ?? [])
    .map(s => JSON.stringify(s))
    .join(' | ');

  const kindOptions = [
    ...domainKinds.map(d => ({ id: d.id, label: d.label })),
    ...laboratorySubkinds.map(s => ({ id: s.id, label: s.label })),
  ];
  const kindOptionsTs = kindOptions
    .map(o => `  { id: ${JSON.stringify(o.id)}, label: ${JSON.stringify(o.label)} },`)
    .join('\n');

  const subdomainValues = laboratorySubkinds.map(s => s.subdomain);

  const ts = `/**
 * Audit event log query taxonomy — GENERATED from contracts/audit-events.json. DO NOT EDIT.
 */

export type EventLogDomain = ${domainUnion};

export type EventLogLaboratoryKindKey = ${subkindUnion};

export type EventLogKind = EventLogDomain | EventLogLaboratoryKindKey;

export type StoredEventScope = ${storedScopeUnion || 'string'};

export type EventLogLaboratorySubdomain = (typeof LABORATORY_SUBDOMAIN_VALUES)[number];

export const LABORATORY_SUBDOMAIN_VALUES = ${JSON.stringify(subdomainValues)} as const;

export const EVENT_LOG_KIND_OPTIONS: { id: EventLogKind; label: string }[] = [
${kindOptionsTs}
];

export const ACCESS_EVENT_TYPES = ${JSON.stringify(query.accessEventTypes ?? [])} as const;

export const DEFAULT_STORED_EVENT_SCOPE = ${JSON.stringify(query.defaultStoredEventScope ?? 'order')} as const;
`;

  writeFile('frontend/src/types/generated/auditEventTaxonomy.ts', ts);
}

export function generateAuditEvents() {
  const jsonPath = path.join(CONTRACTS, 'audit-events.json');
  if (!fs.existsSync(jsonPath)) {
    console.log('skip audit-events.json');
    return;
  }
  const data = readJson('audit-events.json');
  const schemaPath = path.join(CONTRACTS, 'audit-events.schema.json');
  if (fs.existsSync(schemaPath)) {
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(schema);
    if (!validate(data)) {
      console.error('audit-events.json validation failed:', validate.errors);
      process.exit(1);
    }
  }

  verifyAuditQueryTaxonomy(data);

  const events = data.events ?? [];
  const pyEntries = events
    .map(e => `    ${e.member} = ${JSON.stringify(e.wire)}`)
    .join('\n');

  const py = `"""
Audit event wire taxonomy — GENERATED from contracts/audit-events.json. DO NOT EDIT.
"""
from __future__ import annotations

import enum


class EventType(str, enum.Enum):
    """Dot-notation event taxonomy for LIS audit trail."""

${pyEntries}
`;

  writeFile('backend/app/shared/contracts/audit_events.py', py);
  generateAuditTaxonomy(data);
  console.log('wrote audit taxonomy (query)');

  const metaEntries = events.map(e => {
    const parts = [
      `wire: ${JSON.stringify(e.wire)}`,
      `domain: ${JSON.stringify(e.domain)}`,
      `domainLabel: ${JSON.stringify(e.domainLabel)}`,
      `verbPhrase: ${JSON.stringify(e.verbPhrase)}`,
    ];
    if (e.laboratorySubdomain) {
      parts.push(`laboratorySubdomain: ${JSON.stringify(e.laboratorySubdomain)}`);
    }
    if (e.headlineMetaKeys?.length) {
      parts.push(`headlineMetaKeys: ${JSON.stringify(e.headlineMetaKeys)}`);
    }
    if (e.leadingActor) parts.push('leadingActor: true');
    if (e.trailingActor) parts.push(`trailingActor: ${JSON.stringify(e.trailingActor)}`);
    if (e.treatAsSystemActor) parts.push('treatAsSystemActor: true');
    return `  ${JSON.stringify(e.wire)}: { ${parts.join(', ')} }`;
  });

  const wireUnion = events.map(e => JSON.stringify(e.wire)).join(' | ');

  const ts = `/**
 * Audit event definitions — GENERATED from contracts/audit-events.json. DO NOT EDIT.
 */
export type AuditEventWire = ${wireUnion || 'string'};

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
${metaEntries.join(',\n')},
};

export const AUDIT_EVENT_WIRES = ${JSON.stringify(events.map(e => e.wire))} as const;
`;

  writeFile('frontend/src/types/generated/auditEventDefinitions.ts', ts);
}

export function verifyAuditCatalogCoverage() {
  const catalogPath = path.join(ROOT, 'frontend/src/features/audit/catalog.ts');
  if (!fs.existsSync(catalogPath)) {
    console.log('skip audit catalog coverage check');
    return;
  }
  const data = readJson('audit-events.json');
  const wires = new Set((data.events ?? []).map(e => e.wire));
  const catalog = fs.readFileSync(catalogPath, 'utf8');
  if (!catalog.includes('AUDIT_EVENT_WIRES.map')) {
    console.error(
      'Audit catalog must build EVENT_CATALOG from AUDIT_EVENT_WIRES (contracts/audit-events.json).',
    );
    process.exit(1);
  }
  const pyPath = path.join(ROOT, 'backend/app/shared/contracts/audit_events.py');
  if (fs.existsSync(pyPath)) {
    const py = fs.readFileSync(pyPath, 'utf8');
    for (const wire of wires) {
      if (!py.includes(JSON.stringify(wire))) {
        console.error('audit_events.py missing wire', wire);
        process.exit(1);
      }
    }
  }
  const taxTs = path.join(ROOT, 'frontend/src/types/generated/auditEventTaxonomy.ts');
  if (fs.existsSync(taxTs)) {
    const content = fs.readFileSync(taxTs, 'utf8');
    if (!content.includes('GENERATED from contracts/audit-events.json')) {
      console.error('auditEventTaxonomy.ts must be generated from contracts/audit-events.json');
      process.exit(1);
    }
  }
  console.log('audit catalog covers', wires.size, 'event types');
}
