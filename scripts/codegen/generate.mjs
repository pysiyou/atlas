#!/usr/bin/env node
/**
 * Atlas cross-stack codegen — generates Python and TypeScript from contracts/.
 *
 * Human-edited contracts: enums.json, enums.schema.json, container-catalog.json,
 * lab-constants.json, lab-blockers.json, status-presentation.json.
 * Physiologic limits: test-catalog.json result_items.physiologic_range.
 * Generated into contracts/: openapi.json (FastAPI export for openapi-typescript).
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateContainerCatalog } from './lib/container-catalog.mjs';
import { generateEnums } from './lib/domain-enums.mjs';
import { CONTRACTS, readJson, ROOT, writeFile } from './lib/read-contract.mjs';
import { generatePhysiologicLimitsFromCatalog } from './lib/test-catalog-physiologic.mjs';
import { validateEnumsContract } from './lib/validate-enums.mjs';

function generateLabConstants() {
  const data = readJson('lab-constants.json');
  const pyBody = Object.entries(data)
    .map(([key, value]) => `${key} = ${JSON.stringify(value)}`)
    .join('\n');
  const tsBody = Object.entries(data)
    .map(([key, value]) => `  ${key}: ${JSON.stringify(value)},`)
    .join('\n');
  const py = `"""
Laboratory Constants — GENERATED from contracts/lab-constants.json. DO NOT EDIT.
"""
${pyBody}
`;
  const ts = `/**
 * Lab constants — GENERATED from contracts/lab-constants.json. DO NOT EDIT.
 */
export const GENERATED_LAB_CONSTANTS = {
${tsBody}
} as const;
`;
  writeFile('backend/app/shared/contracts/lab_constants.py', py);
  writeFile('frontend/src/types/generated/labConstants.ts', ts);
}

function generateLabBlockers() {
  const jsonPath = path.join(CONTRACTS, 'lab-blockers.json');
  if (!fs.existsSync(jsonPath)) {
    console.log('skip lab-blockers (contracts/lab-blockers.json not found)');
    return;
  }
  const data = readJson('lab-blockers.json');
  const reasons = data.reasons ?? {};
  const keys = Object.keys(reasons);

  const blocksProgressKeys = keys.filter(k => reasons[k].blocksProgress !== false);

  const pyLabels = keys
    .map(k => `    ${JSON.stringify(k)}: ${JSON.stringify(reasons[k].label)},`)
    .join('\n');
  const pyAttention = keys
    .filter(k => reasons[k].attentionType)
    .map(k => `    ${JSON.stringify(k)}: ${JSON.stringify(reasons[k].attentionType)},`)
    .join('\n');

  const py = `"""
Lab attention reason vocabulary — GENERATED from contracts/lab-blockers.json. DO NOT EDIT.
"""
from __future__ import annotations

ATTENTION_REASON_KEYS: frozenset[str] = frozenset(
    {
${keys.map(k => `        ${JSON.stringify(k)},`).join('\n')}
    }
)

BLOCKS_PROGRESS_REASONS: frozenset[str] = frozenset(
    {
${blocksProgressKeys.map(k => `        ${JSON.stringify(k)},`).join('\n')}
    }
)

def reason_blocks_progress(reason: str | None) -> bool:
    if not reason:
        return False
    return reason in BLOCKS_PROGRESS_REASONS

ATTENTION_LABELS: dict[str, str] = {
${pyLabels}
}

ATTENTION_TYPE_BY_REASON: dict[str, str] = {
${pyAttention}
}

ALLOWED_ACTION_KEYS: tuple[str, ...] = (
${(data.allowedActionKeys ?? []).map(k => `    ${JSON.stringify(k)},`).join('\n')}
)

PIPELINE_STAGES: tuple[str, ...] = (
${(data.pipelineStages ?? []).map(s => `    ${JSON.stringify(s)},`).join('\n')}
)

ATTENTION_TYPE_SORT: dict[str, int] = {
${Object.entries(data.attentionTypeSort ?? {})
  .map(([k, v]) => `    ${JSON.stringify(k)}: ${v},`)
  .join('\n')}
}

SUPERVISOR_ATTENTION_TYPES: frozenset[str] = frozenset(
    {
${(data.supervisorAttentionTypes ?? []).map(t => `        ${JSON.stringify(t)},`).join('\n')}
    }
)

PRIORITY_ATTENTION_TYPES: frozenset[str] = frozenset(
    {
${(data.priorityAttentionTypes ?? []).map(t => `        ${JSON.stringify(t)},`).join('\n')}
    }
)
`;
  writeFile('backend/app/shared/contracts/lab_blockers.py', py);

  const tsUnion = keys.map(k => JSON.stringify(k)).join(' | ');
  const tsLabels = keys
    .map(k => `  ${JSON.stringify(k)}: ${JSON.stringify(reasons[k].label)},`)
    .join('\n');
  const tsAttention = keys
    .filter(k => reasons[k].attentionType)
    .map(k => `  ${JSON.stringify(k)}: ${JSON.stringify(reasons[k].attentionType)},`)
    .join('\n');

  const tsBlocksProgress = blocksProgressKeys.map(k => JSON.stringify(k)).join(', ');

  const ts = `/**
 * Lab attention reason vocabulary — GENERATED from contracts/lab-blockers.json. DO NOT EDIT.
 */
export const ATTENTION_REASON_KEYS = [
${keys.map(k => `  ${JSON.stringify(k)},`).join('\n')}
] as const;

export const BLOCKS_PROGRESS_REASONS = new Set<string>([${tsBlocksProgress}]);

export function reasonBlocksProgress(reason: string | null | undefined): boolean {
  return reason != null && BLOCKS_PROGRESS_REASONS.has(reason);
}

export type LabAttentionReason = ${tsUnion || 'string'};

export const ATTENTION_LABELS: Record<LabAttentionReason, string> = {
${tsLabels}
};

export const ATTENTION_ATTENTION_TYPE: Partial<Record<LabAttentionReason, string>> = {
${tsAttention}
};

export const ALLOWED_ACTION_KEYS = ${JSON.stringify(data.allowedActionKeys ?? [])} as const;

export const PIPELINE_STAGES = ${JSON.stringify(data.pipelineStages ?? [])} as const;

export const ATTENTION_TYPE_SORT: Record<string, number> = ${JSON.stringify(
    data.attentionTypeSort ?? {},
    null,
    2
  )};

export const SUPERVISOR_ATTENTION_TYPES = ${JSON.stringify(
    data.supervisorAttentionTypes ?? []
  )} as const;

export const PRIORITY_ATTENTION_TYPES = ${JSON.stringify(
    data.priorityAttentionTypes ?? []
  )} as const;
`;
  writeFile('frontend/src/types/generated/labBlockers.ts', ts);
}

function generateStatusPresentation() {
  const jsonPath = path.join(CONTRACTS, 'status-presentation.json');
  if (!fs.existsSync(jsonPath)) {
    console.log('skip status-presentation (contracts/status-presentation.json not found)');
    return;
  }
  const data = readJson('status-presentation.json');
  const primary = data.canonicalPrimary ?? [];
  const variants = data.badgeVariants ?? {};
  const labels = data.displayLabels ?? {};
  const terminalTest = data.terminalTestStatuses ?? [];

  const pyPrimary = primary.map(v => `    ${JSON.stringify(v)},`).join('\n');
  const pyVariants = Object.entries(variants)
    .map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
    .join('\n');
  const pyLabels = Object.entries(labels)
    .map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
    .join('\n');

  const py = `"""
Status presentation vocabulary — GENERATED from contracts/status-presentation.json. DO NOT EDIT.
"""
from __future__ import annotations

CANONICAL_PRIMARY_VALUES: tuple[str, ...] = (
${pyPrimary}
)

BADGE_VARIANTS: dict[str, str] = {
${pyVariants}
}

DISPLAY_LABELS: dict[str, str] = {
${pyLabels}
}

TERMINAL_TEST_STATUSES: frozenset[str] = frozenset(
    {
${terminalTest.map(t => `        ${JSON.stringify(t)},`).join('\n')}
    }
)
`;
  writeFile('backend/app/shared/contracts/status_presentation_contract.py', py);

  const tsPrimary = primary.map(v => JSON.stringify(v)).join(' | ');
  const ts = `/**
 * Status presentation — GENERATED from contracts/status-presentation.json. DO NOT EDIT.
 */
export const CANONICAL_PRIMARY_VALUES = [
${primary.map(v => `  ${JSON.stringify(v)},`).join('\n')}
] as const;

export type CanonicalPresentationPrimary = ${tsPrimary || 'string'};

export const PRESENTATION_BADGE_VARIANTS: Record<CanonicalPresentationPrimary, string> = ${JSON.stringify(
    variants,
    null,
    2
  )} as Record<CanonicalPresentationPrimary, string>;

export const PRESENTATION_DISPLAY_LABELS: Record<CanonicalPresentationPrimary, string> = ${JSON.stringify(
    labels,
    null,
    2
  )} as Record<CanonicalPresentationPrimary, string>;

export const TERMINAL_TEST_STATUSES = ${JSON.stringify(terminalTest)} as const;
`;
  writeFile('frontend/src/types/generated/statusPresentation.ts', ts);
}

validateEnumsContract();
generateLabConstants();
if (fs.existsSync(path.join(CONTRACTS, 'lab-blockers.json'))) {
  generateLabBlockers();
}
if (fs.existsSync(path.join(CONTRACTS, 'status-presentation.json'))) {
  generateStatusPresentation();
}
generatePhysiologicLimitsFromCatalog();
generateEnums();
generateContainerCatalog();
verifyAuditCatalogCoverage();
generateOpenApiTypes();
console.log('codegen complete');

function verifyAuditCatalogCoverage() {
  const pyPath = path.join(ROOT, 'backend/app/domains/audit/schemas.py');
  const catalogPath = path.join(ROOT, 'frontend/src/features/audit/catalog.ts');
  if (!fs.existsSync(pyPath) || !fs.existsSync(catalogPath)) {
    console.log('skip audit catalog coverage check');
    return;
  }
  const py = fs.readFileSync(pyPath, 'utf8');
  const catalog = fs.readFileSync(catalogPath, 'utf8');
  const eventTypes = new Set();
  for (const match of py.matchAll(/=\s*"([a-z][a-z0-9_.]+)"/g)) {
    const value = match[1];
    if (value.includes('.')) eventTypes.add(value);
  }
  const seeds = new Set();
  for (const match of catalog.matchAll(/eventType:\s*'([^']+)'/g)) {
    seeds.add(match[1]);
  }
  const missing = [...eventTypes].filter(t => !seeds.has(t)).sort();
  if (missing.length > 0) {
    console.error('Audit catalog missing EventType seeds:', missing.join(', '));
    process.exit(1);
  }
  console.log('audit catalog covers', eventTypes.size, 'event types');
}

function exportOpenApiSpec() {
  const openapiPath = path.join(CONTRACTS, 'openapi.json');
  const output = execSync(
    'poetry run python -c "import json; from app.main import app; print(json.dumps(app.openapi()))"',
    {
      cwd: path.join(ROOT, 'backend'),
      encoding: 'utf8',
      shell: true,
    }
  );
  fs.mkdirSync(CONTRACTS, { recursive: true });
  fs.writeFileSync(openapiPath, output);
  console.log('wrote contracts/openapi.json');
  return openapiPath;
}

function generateOpenApiTypes() {
  try {
    const openapiPath = exportOpenApiSpec();
    const outPath = path.join(ROOT, 'frontend/src/lib/api/types/generated/api.d.ts');
    execSync(`npx openapi-typescript ${JSON.stringify(openapiPath)} -o ${JSON.stringify(outPath)}`, {
      cwd: path.dirname(fileURLToPath(import.meta.url)),
      stdio: 'inherit',
    });
    console.log('wrote frontend/src/lib/api/types/generated/api.d.ts');
  } catch (error) {
    console.warn('skip OpenAPI types (backend unavailable or openapi-typescript failed):', error.message);
  }
}
