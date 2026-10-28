/**
 * contracts/lab.json → lab_contract.py + labContract.ts
 */
import Ajv from 'ajv';
import fs from 'node:fs';
import path from 'node:path';
import { CONTRACTS, readJson, writeFile } from './read-contract.mjs';

function validateLab(data) {
  const schemaPath = path.join(CONTRACTS, 'lab.schema.json');
  if (!fs.existsSync(schemaPath)) return;
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(schema);
  if (!validate(data)) {
    console.error('lab.json validation failed:', validate.errors);
    process.exit(1);
  }
}

function dictPy(entries, indent = '    ') {
  return Object.entries(entries)
    .map(([k, v]) => `${indent}${JSON.stringify(k)}: ${JSON.stringify(v)},`)
    .join('\n');
}

export function generateLabContract() {
  const jsonPath = path.join(CONTRACTS, 'lab.json');
  if (!fs.existsSync(jsonPath)) {
    console.log('skip lab.json');
    return;
  }
  const data = readJson('lab.json');
  validateLab(data);

  const limits = data.limits ?? {};
  const blockers = data.blockers ?? {};
  const reasons = blockers.reasons ?? {};
  const keys = Object.keys(reasons);
  const blocksProgressKeys = keys.filter(k => reasons[k].blocksProgress !== false);
  const presentation = data.presentation ?? {};
  const terminalTest = presentation.terminalTestStatuses ?? [];
  const reporting = data.reporting ?? {};
  const priority = data.priority ?? {};

  const statusMaps = presentation.statusToPrimary ?? {};
  const orderMap = statusMaps.order ?? {};
  const testMap = statusMaps.test ?? {};
  const sampleMap = statusMaps.sample ?? {};

  const limitLines = Object.entries(limits)
    .map(([k, v]) => `${k} = ${JSON.stringify(v)}`)
    .join('\n');

  const py = `"""
Laboratory policy contract — GENERATED from contracts/lab.json. DO NOT EDIT.
"""
from __future__ import annotations

# ── Limits ──────────────────────────────────────────────────────────────

${limitLines}

# ── Blockers ────────────────────────────────────────────────────────────

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
${keys.map(k => `    ${JSON.stringify(k)}: ${JSON.stringify(reasons[k].label)},`).join('\n')}
}

ATTENTION_TYPE_BY_REASON: dict[str, str] = {
${keys
  .filter(k => reasons[k].attentionType)
  .map(k => `    ${JSON.stringify(k)}: ${JSON.stringify(reasons[k].attentionType)},`)
  .join('\n')}
}

ALLOWED_ACTION_KEYS: tuple[str, ...] = (
${(blockers.allowedActionKeys ?? []).map(k => `    ${JSON.stringify(k)},`).join('\n')}
)

PIPELINE_STAGES: tuple[str, ...] = (
${(blockers.pipelineStages ?? []).map(s => `    ${JSON.stringify(s)},`).join('\n')}
)

ATTENTION_TYPE_SORT: dict[str, int] = {
${dictPy(blockers.attentionTypeSort ?? {})}
}

SUPERVISOR_ATTENTION_TYPES: frozenset[str] = frozenset(
    {
${(blockers.supervisorAttentionTypes ?? []).map(t => `        ${JSON.stringify(t)},`).join('\n')}
    }
)

PRIORITY_ATTENTION_TYPES: frozenset[str] = frozenset(
    {
${(blockers.priorityAttentionTypes ?? []).map(t => `        ${JSON.stringify(t)},`).join('\n')}
    }
)

# ── Presentation maps ───────────────────────────────────────────────────

TERMINAL_TEST_STATUSES: frozenset[str] = frozenset(
    {
${terminalTest.map(t => `        ${JSON.stringify(t)},`).join('\n')}
    }
)

ORDER_STATUS_TO_PRIMARY: dict[str, str] = {
${dictPy(orderMap)}
}

TEST_STATUS_TO_PRIMARY: dict[str, str] = {
${dictPy(testMap)}
}

SAMPLE_STATUS_TO_PRIMARY: dict[str, str] = {
${dictPy(sampleMap)}
}

BLOCKED_OVERLAY_TEST_EXCLUDE_TERMINAL: bool = True
BLOCKED_OVERLAY_SAMPLE_WHEN_STATUS: str = ${JSON.stringify(presentation.blockedOverlay?.sample?.whenStatus ?? 'pending')}

TEST_ESCALATED_SECONDARY_FROM_ATTENTION: bool = ${presentation.secondaryRules?.testEscalated?.fromAttentionLabel === true ? 'True' : 'False'}

# ── Reporting inactive test statuses ────────────────────────────────────

INACTIVE_TEST_STATUSES_FOR_REPORTS: frozenset[str] = frozenset(
    {
${(reporting.inactiveTestStatusesForReports ?? []).map(s => `        ${JSON.stringify(s)},`).join('\n')}
    }
)

INACTIVE_TEST_STATUSES_FOR_ROLLUP: frozenset[str] = frozenset(
    {
${(reporting.inactiveTestStatusesForRollup ?? []).map(s => `        ${JSON.stringify(s)},`).join('\n')}
    }
)

# ── Priority sort helpers ───────────────────────────────────────────────

PRIORITY_RANK: dict[str, int] = {
${dictPy(priority.rank ?? {})}
}

PRIORITY_WEIGHT: dict[str, int] = {
${dictPy(priority.weight ?? {})}
}
`;

  writeFile('backend/app/shared/contracts/lab_contract.py', py);

  const tsUnion = keys.map(k => JSON.stringify(k)).join(' | ');
  const tsBlocksProgress = blocksProgressKeys.map(k => JSON.stringify(k)).join(', ');

  const ts = `/**
 * Laboratory policy contract — GENERATED from contracts/lab.json. DO NOT EDIT.
 */
export const GENERATED_LAB_CONSTANTS = {
${Object.entries(limits)
  .map(([k, v]) => `  ${k}: ${JSON.stringify(v)},`)
  .join('\n')}
} as const;

export const ATTENTION_REASON_KEYS = [
${keys.map(k => `  ${JSON.stringify(k)},`).join('\n')}
] as const;

export const BLOCKS_PROGRESS_REASONS = new Set<string>([${tsBlocksProgress}]);

export function reasonBlocksProgress(reason: string | null | undefined): boolean {
  return reason != null && BLOCKS_PROGRESS_REASONS.has(reason);
}

export type LabAttentionReason = ${tsUnion || 'string'};

export const ATTENTION_LABELS: Record<LabAttentionReason, string> = {
${keys.map(k => `  ${JSON.stringify(k)}: ${JSON.stringify(reasons[k].label)},`).join('\n')}
};

export const ATTENTION_ATTENTION_TYPE: Partial<Record<LabAttentionReason, string>> = {
${keys
  .filter(k => reasons[k].attentionType)
  .map(k => `  ${JSON.stringify(k)}: ${JSON.stringify(reasons[k].attentionType)},`)
  .join('\n')}
};

export const ALLOWED_ACTION_KEYS = ${JSON.stringify(blockers.allowedActionKeys ?? [])} as const;

export const PIPELINE_STAGES = ${JSON.stringify(blockers.pipelineStages ?? [])} as const;

export const ATTENTION_TYPE_SORT: Record<string, number> = ${JSON.stringify(
    blockers.attentionTypeSort ?? {},
    null,
    2,
  )};

export const SUPERVISOR_ATTENTION_TYPES = ${JSON.stringify(
    blockers.supervisorAttentionTypes ?? [],
  )} as const;

export const PRIORITY_ATTENTION_TYPES = ${JSON.stringify(
    blockers.priorityAttentionTypes ?? [],
  )} as const;

export const TERMINAL_TEST_STATUSES = ${JSON.stringify(terminalTest)} as const;

export const ORDER_STATUS_TO_PRIMARY: Record<string, string> = ${JSON.stringify(orderMap, null, 2)};

export const TEST_STATUS_TO_PRIMARY: Record<string, string> = ${JSON.stringify(testMap, null, 2)};

export const SAMPLE_STATUS_TO_PRIMARY: Record<string, string> = ${JSON.stringify(sampleMap, null, 2)};

export const INACTIVE_TEST_STATUSES_FOR_REPORTS = ${JSON.stringify(
    reporting.inactiveTestStatusesForReports ?? [],
  )} as const;

export const INACTIVE_TEST_STATUSES_FOR_ROLLUP = ${JSON.stringify(
    reporting.inactiveTestStatusesForRollup ?? [],
  )} as const;

/** Report lines excluded from PDF/list eligibility (subset of rollup inactive). */
export const INACTIVE_REPORTABLE_TEST_STATUSES = new Set<string>(INACTIVE_TEST_STATUSES_FOR_REPORTS);

export const PRIORITY_RANK: Record<string, number> = ${JSON.stringify(priority.rank ?? {}, null, 2)};

export const PRIORITY_WEIGHT: Record<string, number> = ${JSON.stringify(priority.weight ?? {}, null, 2)};
`;

  writeFile('frontend/src/types/generated/labContract.ts', ts);
}
