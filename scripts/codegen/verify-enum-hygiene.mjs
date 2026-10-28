#!/usr/bin/env node
/**
 * Post-codegen checks — enum single-source-of-truth hygiene.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FRONTEND = path.join(ROOT, 'frontend/src');
const CONTRACTS = path.join(ROOT, 'contracts');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (
        full.includes(`${path.sep}types${path.sep}enums${path.sep}generated`) ||
        full.includes(`${path.sep}lib${path.sep}api${path.sep}types${path.sep}generated`)
      ) {
        continue;
      }
      walk(full, acc);
    } else if (/\.(ts|tsx)$/.test(ent.name)) {
      acc.push(full);
    }
  }
  return acc;
}

let failed = false;

function fail(msg) {
  console.error(msg);
  failed = true;
}

const orderTs = read('frontend/src/types/enums/generated/order.ts');
if (orderTs.includes('export const PAYMENT_METHOD_OPTIONS')) {
  fail('order.ts must not export PAYMENT_METHOD_OPTIONS (use types/payments.ts)');
}
if (!orderTs.includes('GENERATED from contracts/enums.json')) {
  fail('Generated enum TS must reference contracts/enums.json');
}

const catalogTs = read('frontend/src/types/enums/generated/container-catalog.ts');
if (!catalogTs.includes('GENERATED from contracts/container-catalog.json')) {
  fail('container-catalog.ts must be generated from contracts/container-catalog.json');
}
if (/export type ContainerType\s*=/.test(catalogTs) || /export type ContainerTopColor\s*=/.test(catalogTs)) {
  fail('container-catalog.ts must not alias ContainerType/ContainerTopColor to catalog ids');
}

const duplicateEnumPattern =
  /export type (RemedyType|QualityStage|OrderStatus|PaymentMethod|TestStatus)\s*=\s*['"]/;

for (const file of walk(FRONTEND)) {
  const rel = path.relative(FRONTEND, file);
  const text = fs.readFileSync(file, 'utf8');
  if (duplicateEnumPattern.test(text)) {
    fail(`Duplicate domain enum type in ${rel} — use @/types/enums`);
  }
}

const legacyContractFiles = [
  'contracts/lab-constants.json',
  'contracts/lab-blockers.json',
  'contracts/status-presentation.json',
  'frontend/src/config/feedbackCatalog.ts',
  'frontend/src/types/generated/labConstants.ts',
  'frontend/src/types/generated/labBlockers.ts',
  'frontend/src/types/generated/statusPresentation.ts',
  'backend/app/shared/contracts/lab_constants.py',
  'backend/app/shared/contracts/lab_blockers.py',
  'backend/app/shared/contracts/status_presentation_contract.py',
  'backend/app/shared/contracts/test-catalog.json',
];

for (const rel of legacyContractFiles) {
  if (fs.existsSync(path.join(ROOT, rel))) {
    fail(`Legacy contract artifact still present: ${rel}`);
  }
}

const labContractTs = read('frontend/src/types/generated/labContract.ts');
if (!labContractTs.includes('GENERATED from contracts/lab.json')) {
  fail('labContract.ts must be generated from contracts/lab.json');
}
if (!labContractTs.includes('VALIDATION_REMEDY_WIRES')) {
  fail('labContract.ts must export qualityWorkflow VALIDATION_REMEDY_WIRES');
}

const feedbackTs = read('frontend/src/types/generated/feedbackCatalog.ts');
if (!feedbackTs.includes('GENERATED from contracts/feedback.json')) {
  fail('feedbackCatalog.ts must be generated from contracts/feedback.json');
}

const auditTaxonomyTs = read('frontend/src/types/generated/auditEventTaxonomy.ts');
if (!auditTaxonomyTs.includes('GENERATED from contracts/audit-events.json')) {
  fail('auditEventTaxonomy.ts must be generated from contracts/audit-events.json');
}

const eventLogFilterConfig = read('frontend/src/features/audit/eventLogFilterConfig.ts');
if (eventLogFilterConfig.includes("{ id: 'patient'")) {
  fail('eventLogFilterConfig.ts must re-export EVENT_LOG_KIND_OPTIONS from generated auditEventTaxonomy');
}

const kindsPy = read('backend/app/domains/audit/kinds.py');
if (kindsPy.includes('_LABORATORY_SUBKIND_PREFIXES = {')) {
  fail('kinds.py must import LABORATORY_SUBKIND_PREFIXES from audit_taxonomy, not inline literals');
}

const auditTaxonomyPy = read('backend/app/shared/contracts/audit_taxonomy.py');
if (!auditTaxonomyPy.includes('GENERATED from contracts/audit-events.json')) {
  fail('audit_taxonomy.py must be generated from contracts/audit-events.json');
}

const issuesService = read('backend/app/domains/lab/quality/issues_service.py');
if (issuesService.includes('_VALIDATION_REMEDIES:') || issuesService.includes('_SAMPLE_UNFINISHED_REMEDIES:')) {
  fail('issues_service.py must use lab_contract VALIDATION_REMEDIES / SAMPLE_UNFINISHED_REMEDIES, not inline lists');
}

const qualityToast = read('frontend/src/features/lab/validation/qualityIssueToastMessages.ts');
if (qualityToast.includes("case 'retry_same_sample'")) {
  fail('qualityIssueToastMessages.ts must resolve toasts from labContract QUALITY_ISSUE_SUCCESS_TOAST_RULES');
}

const qualityPopover = read('frontend/src/features/lab/constants/qualityIssuePopoverCopy.ts');
if (qualityPopover.includes('VALIDATION_REMEDY_META:')) {
  fail('qualityIssuePopoverCopy.ts must use REMEDY_PRESENTATION from labContract');
}

const labContractPy = read('backend/app/shared/contracts/lab_contract.py');
if (!labContractPy.includes('VALIDATION_REMEDIES:')) {
  fail('lab_contract.py must export VALIDATION_REMEDIES from qualityWorkflow');
}

const commonPy = read('backend/app/platform/utils/common.py');
if (commonPy.includes('_SPECIMEN_KEYWORDS')) {
  fail('common.py must not define _SPECIMEN_KEYWORDS — use rejection_reasons registry');
}

const catalogJson = read('contracts/test-catalog.json');
if (catalogJson.includes('"reason":')) {
  fail('test-catalog.json must not contain legacy "reason" fields — use reason id strings in rejection criteria');
}
if (catalogJson.includes('"reasonId":')) {
  fail('test-catalog.json rejection criteria must be string arrays, not { reasonId } objects');
}

const rejectionRegistryTs = read('frontend/src/types/generated/rejectionReasonRegistry.ts');
if (!rejectionRegistryTs.includes('GENERATED from contracts/rejection-reasons.json')) {
  fail('rejectionReasonRegistry.ts must be generated from contracts/rejection-reasons.json');
}

const rejectionReasonsPy = read('backend/app/shared/contracts/rejection_reasons.py');
if (!rejectionReasonsPy.includes('GENERATED from contracts/rejection-reasons.json')) {
  fail('rejection_reasons.py must be generated from contracts/rejection-reasons.json');
}

if (failed) {
  process.exit(1);
}

console.log('enum hygiene checks passed');
