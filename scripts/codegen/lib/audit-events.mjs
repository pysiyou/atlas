/**
 * contracts/audit-events.json → audit_events.py + auditEventDefinitions.ts
 */
import Ajv from 'ajv';
import fs from 'node:fs';
import path from 'node:path';
import { CONTRACTS, readJson, ROOT, writeFile } from './read-contract.mjs';

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
  console.log('audit catalog covers', wires.size, 'event types');
}
