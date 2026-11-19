#!/usr/bin/env node
/**
 * Generate backend/app/shared/generated/lab_policy.py from contracts/lab-policy.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const contractPath = path.join(root, 'contracts', 'lab-policy.json');
const outPath = path.join(root, 'backend', 'app', 'shared', 'generated', 'lab_policy.py');

const data = JSON.parse(fs.readFileSync(contractPath, 'utf-8'));

function pyStr(v) {
  return JSON.stringify(v);
}

function pyDict(obj, indent = 0) {
  const pad = '    '.repeat(indent);
  const lines = ['{'];
  for (const [k, v] of Object.entries(obj)) {
    const key = pyStr(k);
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      lines.push(`${pad}    ${key}: ${pyDict(v, indent + 1)},`);
    } else if (Array.isArray(v)) {
      lines.push(`${pad}    ${key}: ${pyTupleOrList(v)},`);
    } else if (typeof v === 'boolean') {
      lines.push(`${pad}    ${key}: ${v ? 'True' : 'False'},`);
    } else if (typeof v === 'number') {
      lines.push(`${pad}    ${key}: ${v},`);
    } else {
      lines.push(`${pad}    ${key}: ${pyStr(v)},`);
    }
  }
  lines.push(`${pad}}`);
  return lines.join('\n');
}

function pyFrozenset(arr) {
  const body = arr.map(x => `        ${pyStr(x)},`).join('\n');
  return `frozenset(\n    {\n${body}\n    }\n)`;
}

function pyTuple(arr) {
  return `(\n${arr.map(x => `    ${pyStr(x)},`).join('\n')}\n)`;
}

function pyTupleOrList(arr) {
  return pyTuple(arr);
}

function pyDictFlat(obj) {
  const lines = ['{'];
  for (const [k, v] of Object.entries(obj)) {
    lines.push(`    ${pyStr(k)}: ${typeof v === 'number' ? v : pyStr(v)},`);
  }
  lines.push('}');
  return lines.join('\n');
}

function pyDictInt(obj) {
  const lines = ['{'];
  for (const [k, v] of Object.entries(obj)) {
    lines.push(`    ${pyStr(k)}: ${v},`);
  }
  lines.push('}');
  return lines.join('\n');
}

const { limits, blockers, presentation, reporting, priority, qualityWorkflow } = data;

const reasonKeys = Object.keys(blockers.reasons);
const blocksProgress = reasonKeys.filter(k => blockers.reasons[k].blocksProgress);
const attentionLabels = {};
const attentionTypeByReason = {};
for (const [k, v] of Object.entries(blockers.reasons)) {
  attentionLabels[k] = v.label;
  attentionTypeByReason[k] = v.attentionType;
}

const overlay = presentation.blockedOverlay ?? {};
const testOverlay = overlay.test ?? {};
const sampleOverlay = overlay.sample ?? {};

const lines = [
  '"""',
  'Laboratory policy — GENERATED from contracts/lab-policy.json. DO NOT EDIT.',
  '"""',
  'from __future__ import annotations',
  '',
  '# ── Limits ──────────────────────────────────────────────────────────────',
  '',
  `MAX_RETEST_ATTEMPTS = ${limits.MAX_RETEST_ATTEMPTS}`,
  `MAX_RECOLLECTION_ATTEMPTS = ${limits.MAX_RECOLLECTION_ATTEMPTS}`,
  `QUEUE_AGE_WARNING_HOURS = ${limits.QUEUE_AGE_WARNING_HOURS}`,
  `QUEUE_AGE_CRITICAL_HOURS = ${limits.QUEUE_AGE_CRITICAL_HOURS}`,
  `SPECIMEN_DEAD_VOLUME_ML = ${limits.SPECIMEN_DEAD_VOLUME_ML}`,
  '',
  '# ── Blockers ────────────────────────────────────────────────────────────',
  '',
  `ATTENTION_REASON_KEYS: frozenset[str] = ${pyFrozenset(reasonKeys)}`,
  '',
  `BLOCKS_PROGRESS_REASONS: frozenset[str] = ${pyFrozenset(blocksProgress)}`,
  '',
  '',
  'def reason_blocks_progress(reason: str | None) -> bool:',
  '    if not reason:',
  '        return False',
  '    return reason in BLOCKS_PROGRESS_REASONS',
  '',
  '',
  `ATTENTION_LABELS: dict[str, str] = ${pyDictFlat(attentionLabels)}`,
  '',
  `ATTENTION_TYPE_BY_REASON: dict[str, str] = ${pyDictFlat(attentionTypeByReason)}`,
  '',
  `ALLOWED_ACTION_KEYS: tuple[str, ...] = ${pyTuple(blockers.allowedActionKeys)}`,
  '',
  `PIPELINE_STAGES: tuple[str, ...] = ${pyTuple(blockers.pipelineStages)}`,
  '',
  `ATTENTION_TYPE_SORT: dict[str, int] = ${pyDictInt(blockers.attentionTypeSort)}`,
  '',
  `SUPERVISOR_ATTENTION_TYPES: frozenset[str] = ${pyFrozenset(blockers.supervisorAttentionTypes)}`,
  '',
  `PRIORITY_ATTENTION_TYPES: frozenset[str] = ${pyFrozenset(blockers.priorityAttentionTypes)}`,
  '',
  '# ── Presentation maps ───────────────────────────────────────────────────',
  '',
  `TERMINAL_TEST_STATUSES: frozenset[str] = ${pyFrozenset(presentation.terminalTestStatuses)}`,
  '',
  `ORDER_STATUS_TO_PRIMARY: dict[str, str] = ${pyDictFlat(presentation.statusToPrimary.order)}`,
  '',
  `TEST_STATUS_TO_PRIMARY: dict[str, str] = ${pyDictFlat(presentation.statusToPrimary.test)}`,
  '',
  `SAMPLE_STATUS_TO_PRIMARY: dict[str, str] = ${pyDictFlat(presentation.statusToPrimary.sample)}`,
  '',
  `BLOCKED_OVERLAY_TEST_EXCLUDE_TERMINAL: bool = ${testOverlay.excludeStatusesRef === 'terminalTestStatuses' ? 'True' : 'False'}`,
  `BLOCKED_OVERLAY_SAMPLE_WHEN_STATUS: str = ${pyStr(sampleOverlay.whenStatus ?? 'pending')}`,
  '',
  `TEST_ESCALATED_SECONDARY_FROM_ATTENTION: bool = ${presentation.secondaryRules?.testEscalated?.fromAttentionLabel ? 'True' : 'False'}`,
  '',
  '# ── Reporting inactive test statuses ────────────────────────────────────',
  '',
  `INACTIVE_TEST_STATUSES_FOR_REPORTS: frozenset[str] = ${pyFrozenset(reporting.inactiveTestStatusesForReports)}`,
  '',
  `INACTIVE_TEST_STATUSES_FOR_ROLLUP: frozenset[str] = ${pyFrozenset(reporting.inactiveTestStatusesForRollup)}`,
  '',
  `INACTIVE_TEST_STATUSES_FOR_BILLING: frozenset[str] = ${pyFrozenset(reporting.inactiveTestStatusesForBilling)}`,
  '',
  '# ── Priority sort helpers ───────────────────────────────────────────────',
  '',
  `PRIORITY_RANK: dict[str, int] = ${pyDictInt(priority.rank)}`,
  '',
  `PRIORITY_WEIGHT: dict[str, int] = ${pyDictInt(priority.weight)}`,
  '',
  '# ── Quality workflow (remedy policy) ───────────────────────────────────',
  '',
  `VALIDATION_REMEDIES: tuple[str, ...] = ${pyTuple(qualityWorkflow.validation.allowedRemedies)}`,
  '',
  `SAMPLE_UNFINISHED_REMEDIES: tuple[str, ...] = ${pyTuple(qualityWorkflow.sampleUnfinished.allowedRemedies)}`,
  '',
];

fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf-8');
console.log(`Wrote ${path.relative(root, outPath)}`);