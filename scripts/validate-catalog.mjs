#!/usr/bin/env node
/**
 * Validate catalog contracts:
 * 1. Meta-schema checks on contracts/*.schema.json
 * 2. Ajv instance validation (analytes, orderable-tests, workups, rejection registries, enums)
 * 3. FK graph: workups → tests → analytes; sample/result rejection registries
 * 4. LOINC hygiene on analytes and orderable tests
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'frontend', 'package.json'),
);
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const contractsDir = path.join(root, 'contracts');
const commonDefsSchemaPath = path.join(contractsDir, '_schema', 'common.defs.json');
const sampleRejectionPath = path.join(contractsDir, 'rejection-specimen.json');
const resultRejectionPath = path.join(contractsDir, 'rejection-analytical.json');
const sampleRejectionSchemaPath = path.join(contractsDir, 'rejection-specimen.schema.json');
const resultRejectionSchemaPath = path.join(contractsDir, 'rejection-analytical.schema.json');
const LOINC_PATTERN = /^[0-9]{1,5}-[0-9]$/;

const paths = {
  analyte: path.join(contractsDir, 'analytes.json'),
  analyteSchema: path.join(contractsDir, 'analytes.schema.json'),
  tests: path.join(contractsDir, 'orderable-tests.json'),
  testsSchema: path.join(contractsDir, 'orderable-tests.schema.json'),
  workups: path.join(contractsDir, 'workups.json'),
  workupsSchema: path.join(contractsDir, 'workups.schema.json'),
  enums: path.join(contractsDir, 'enums.json'),
  enumsSchema: path.join(contractsDir, 'enums.schema.json'),
  entityIds: path.join(contractsDir, 'entity-ids.json'),
};

/**
 * @param {string} filePath
 * @returns {unknown}
 */
function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * @returns {import('ajv').default}
 */
function createAjv() {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv;
}

/**
 * @param {object} schema
 * @returns {(data: unknown) => boolean}
 */
function compileDraft07(schema) {
  const ajv = createAjv();
  const copy = { ...schema };
  delete copy.$schema;
  return ajv.compile(copy);
}

/**
 * @param {string} label
 * @param {(data: unknown) => boolean} validate
 * @param {object} data
 * @returns {number}
 */
function validateAgainstSchema(label, validate, data) {
  const instance = { ...data };
  delete instance.$schema;
  if (validate(instance)) {
    return 0;
  }
  console.error(`${label}:`, validate.errors);
  return 1;
}

/**
 * @param {import('ajv').default} ajv
 * @param {string} label
 * @param {object} schemaDoc
 * @returns {number}
 */
function validateSchemaMeta(ajv, label, schemaDoc) {
  const copy = { ...schemaDoc };
  delete copy.$schema;
  const valid = ajv.validate('http://json-schema.org/draft-07/schema#', copy);
  if (valid) {
    return 0;
  }
  console.error(`${label} meta-schema:`, ajv.errors);
  return 1;
}

/**
 * Run referential and LOINC checks.
 *
 * @param {{
 *   analytes: { analytes?: { analyte_code?: string; loinc_code?: string }[] };
 *   tests: { tests?: Record<string, unknown>[] };
 *   workups: { workups?: { id?: string; test_codes?: string[] }[] };
 * }} docs
 * @returns {number}
 */
export function runCatalogIntegrityChecks(docs) {
  let errors = 0;
  const analyteCodes = new Set(
    (docs.analytes.analytes ?? [])
      .map(a => a?.analyte_code)
      .filter(c => typeof c === 'string'),
  );
  const testCodes = new Set(
    (docs.tests.tests ?? [])
      .map(t => t?.test_code)
      .filter(c => typeof c === 'string'),
  );
  const workupIds = new Set(
    (docs.workups.workups ?? []).map(w => w?.id).filter(id => typeof id === 'string'),
  );

  for (const a of docs.analytes.analytes ?? []) {
    const code = a?.analyte_code ?? '(unknown)';
    if (Object.prototype.hasOwnProperty.call(a, 'loinc_codes')) {
      console.error(`${code}: leftover loinc_codes on analyte; use loinc_code`);
      errors += 1;
    }
    if (a?.loinc_code) {
      if (!LOINC_PATTERN.test(a.loinc_code)) {
        console.error(`${code}: invalid analyte loinc_code ${JSON.stringify(a.loinc_code)}`);
        errors += 1;
      }
    }
  }

  /** @type {Map<string, string>} */
  const loincByTest = new Map();

  for (const test of docs.tests.tests ?? []) {
    const code = typeof test.test_code === 'string' ? test.test_code : '(unknown)';
    const analyteList = Array.isArray(test.analytes) ? test.analytes : [];

    for (const ac of analyteList) {
      if (typeof ac !== 'string') {
        console.error(`${code}: analyte entry must be string`);
        errors += 1;
        continue;
      }
      if (!analyteCodes.has(ac)) {
        console.error(`${code}: unknown analyte_code "${ac}"`);
        errors += 1;
      }
      /** @type {Map<string, string>} */
      const deprecatedAliases = new Map([['PLT', 'PLAT']]);
      if (deprecatedAliases.has(ac)) {
        console.error(
          `${code}: deprecated analyte mnemonic "${ac}"; use "${deprecatedAliases.get(ac)}"`,
        );
        errors += 1;
      }
    }

    if (Object.prototype.hasOwnProperty.call(test, 'workups')) {
      console.error(`${code}: workups[] is not allowed on orderable tests; use workups.json test_codes`);
      errors += 1;
    }

    for (const legacyField of ['mapped_category', 'mapped_sample_type', 'validation_rejection_criteria']) {
      if (Object.prototype.hasOwnProperty.call(test, legacyField)) {
        console.error(`${code}: obsolete field ${legacyField}`);
        errors += 1;
      }
    }

    const collection = test.collection;
    if (!collection || typeof collection !== 'object' || typeof collection.sample_type !== 'string') {
      console.error(`${code}: collection.sample_type is required`);
      errors += 1;
    }
    for (const legacy of ['sample', 'sample_type', 'test_category', 'category', 'method_common', 'sources']) {
      if (Object.prototype.hasOwnProperty.call(test, legacy)) {
        console.error(`${code}: obsolete field ${legacy}`);
        errors += 1;
      }
    }

    if (Object.prototype.hasOwnProperty.call(test, 'loinc_codes')) {
      console.error(`${code}: leftover loinc_codes on test; use loinc_code`);
      errors += 1;
    }

    if (Object.prototype.hasOwnProperty.call(test, 'loinc_code') && test.loinc_code) {
      const loinc = test.loinc_code;
      if (typeof loinc !== 'string' || !LOINC_PATTERN.test(loinc)) {
        console.error(`${code}: invalid test loinc_code ${JSON.stringify(loinc)}`);
        errors += 1;
      } else {
        const allowDupWithSoleAnalyte =
          analyteList.length === 1 &&
          docs.analytes.analytes?.find(a => a.analyte_code === analyteList[0])?.loinc_code === loinc;
        const owner = loincByTest.get(loinc);
        if (owner && !allowDupWithSoleAnalyte) {
          console.error(`${code}: test loinc_code ${loinc} already used by ${owner}`);
          errors += 1;
        } else if (!owner) {
          loincByTest.set(loinc, code);
        }
      }
    }

    if (analyteList.length < 1) {
      console.error(`${code}: analytes[] must contain at least one analyte_code`);
      errors += 1;
    }

    if (analyteList.length > 1 && !test.loinc_code) {
      console.error(`${code}: multi-analyte test requires order loinc_code`);
      errors += 1;
    }

    if (analyteList.length === 1 && test.loinc_code) {
      const sole = analyteList[0];
      const analyteRow = docs.analytes.analytes?.find(a => a.analyte_code === sole);
      const analyteLoinc =
        analyteRow && typeof analyteRow.loinc_code === 'string' ? analyteRow.loinc_code : null;
      if (analyteLoinc && test.loinc_code !== analyteLoinc) {
        console.error(
          `${code}: single-analyte test loinc_code ${JSON.stringify(test.loinc_code)} must match analyte ${sole} (${analyteLoinc})`,
        );
        errors += 1;
      }
    }
  }

  for (const workup of docs.workups.workups ?? []) {
    const wid = workup.id ?? '(unknown)';
    if (Object.prototype.hasOwnProperty.call(workup, 'loinc_code')) {
      console.error(`workup ${wid}: loinc_code is not allowed on clinical workups`);
      errors += 1;
    }
    for (const tc of workup.test_codes ?? []) {
      if (!testCodes.has(tc)) {
        console.error(`workup ${wid}: unknown test_code "${tc}"`);
        errors += 1;
      }
    }
  }

  return errors;
}

/**
 * Phase-5 spot checks: TSH single-analyte, CBC multi-analyte.
 *
 * @param {{
 *   analytes: { analytes?: { analyte_code?: string; loinc_code?: string }[] };
 *   tests: { tests?: Record<string, unknown>[] };
 * }} docs
 * @returns {number}
 */
function runRequiredFixtureChecks(docs) {
  let errors = 0;
  const byTestCode = new Map(
    (docs.tests.tests ?? [])
      .filter(t => typeof t?.test_code === 'string')
      .map(t => [t.test_code, t]),
  );
  const byAnalyte = new Map(
    (docs.analytes.analytes ?? [])
      .filter(a => typeof a?.analyte_code === 'string')
      .map(a => [a.analyte_code, a]),
  );

  const tsh = byTestCode.get('TSH');
  if (!tsh) {
    console.error('fixture: missing orderable test TSH');
    errors += 1;
  } else {
    if (tsh.loinc_code !== '3016-3') {
      console.error('fixture TSH: expected order loinc_code 3016-3');
      errors += 1;
    }
    const tshAnalytes = tsh.analytes;
    if (!Array.isArray(tshAnalytes) || tshAnalytes.length !== 1 || tshAnalytes[0] !== 'TSH') {
      console.error('fixture TSH: expected analytes ["TSH"]');
      errors += 1;
    }
    const tshRow = byAnalyte.get('TSH');
    if (tshRow?.loinc_code !== '3016-3') {
      console.error('fixture TSH analyte: expected observation loinc 3016-3');
      errors += 1;
    }
  }

  const cbc = byTestCode.get('CBC');
  if (!cbc) {
    console.error('fixture: missing orderable test CBC');
    errors += 1;
  } else {
    if (cbc.loinc_code !== '57021-8') {
      console.error('fixture CBC: expected order loinc_code 57021-8');
      errors += 1;
    }
    const cbcAnalytes = cbc.analytes;
    if (!Array.isArray(cbcAnalytes) || cbcAnalytes.length < 2) {
      console.error('fixture CBC: expected multiple analytes');
      errors += 1;
    } else {
      for (const code of ['WBC', 'HGB', 'PLAT']) {
        if (!cbcAnalytes.includes(code)) {
          console.error(`fixture CBC: missing analyte ${code}`);
          errors += 1;
        }
      }
    }
    const hgb = byAnalyte.get('HGB');
    if (hgb?.loinc_code !== '718-7') {
      console.error('fixture CBC/HGB analyte: expected loinc 718-7');
      errors += 1;
    }
  }

  if (errors === 0) {
    console.log('ok fixtures TSH + CBC');
  }
  return errors;
}

/**
 * Ensure sample.validation / validation.rejection_criteria ids exist in registries.
 *
 * @param {{
 *   analytes: { analytes?: Record<string, unknown>[] };
 *   tests: { tests?: Record<string, unknown>[] };
 * }} docs
 * @returns {number}
 */
function runRejectionReasonChecks(docs) {
  if (!fs.existsSync(sampleRejectionPath) || !fs.existsSync(resultRejectionPath)) {
    console.warn('rejection registries not found; skipping rejection FK checks');
    return 0;
  }
  const sampleRegistry = readJson(sampleRejectionPath);
  const resultRegistry = readJson(resultRejectionPath);
  const sampleIds = new Set(
    (sampleRegistry.reasons ?? [])
      .map(r => r?.id)
      .filter(id => typeof id === 'string'),
  );
  const resultIds = new Set(
    (resultRegistry.reasons ?? [])
      .map(r => r?.id)
      .filter(id => typeof id === 'string'),
  );
  let errors = 0;
  for (const id of sampleIds) {
    if (resultIds.has(id)) {
      console.error(`rejection registries: duplicate id "${id}" in sample and result (ids must be globally unique)`);
      errors += 1;
    }
  }
  /**
   * @param {unknown} list
   * @param {string} ctx
   */
  function checkList(list, ctx, allowedIds) {
    let err = 0;
    if (!Array.isArray(list)) {
      return 0;
    }
    for (const id of list) {
      if (typeof id !== 'string' || !allowedIds.has(id)) {
        console.error(`${ctx}: unknown rejection reason id "${id}"`);
        err += 1;
      }
    }
    return err;
  }

  for (const test of docs.tests.tests ?? []) {
    const code = typeof test.test_code === 'string' ? test.test_code : '(unknown)';
    const validation = test.validation;
    const validationList =
      validation && typeof validation === 'object'
        ? /** @type {{ rejection_criteria?: unknown[] }} */ (validation).rejection_criteria
        : undefined;
    errors += checkList(validationList, `${code} validation.rejection_criteria`, resultIds);
    const collection = test.collection;
    if (collection && typeof collection === 'object') {
      errors += checkList(
        /** @type {{ rejection_criteria?: unknown[] }} */ (collection).rejection_criteria,
        `${code} collection.rejection_criteria`,
        sampleIds,
      );
    }
  }
  for (const analyte of docs.analytes.analytes ?? []) {
    const code =
      typeof analyte.analyte_code === 'string' ? analyte.analyte_code : '(unknown)';
    if (Object.prototype.hasOwnProperty.call(analyte, 'validation_rejection_criteria')) {
      console.error(`${code}: obsolete field validation_rejection_criteria; use validation.rejection_criteria`);
      errors += 1;
    }
    const analyteValidation = analyte.validation;
    const analyteValidationList =
      analyteValidation && typeof analyteValidation === 'object'
        ? /** @type {{ rejection_criteria?: unknown[] }} */ (analyteValidation).rejection_criteria
        : undefined;
    errors += checkList(analyteValidationList, `${code} validation.rejection_criteria`, resultIds);
    const sample = analyte.sample;
    if (sample && typeof sample === 'object') {
      errors += checkList(
        /** @type {{ rejection_criteria?: unknown[] }} */ (sample).rejection_criteria,
        `${code} sample.rejection_criteria`,
        sampleIds,
      );
    }
  }
  if (errors === 0) {
    console.log('ok rejection reason references');
  }
  return errors;
}

/**
 * @param {import('ajv').default} ajv
 * @returns {number}
 */
function validateAllContractSchemas(ajv) {
  let errors = 0;
  const schemaNames = fs
    .readdirSync(contractsDir)
    .filter(name => name.endsWith('.schema.json'))
    .sort();

  for (const name of schemaNames) {
    const filePath = path.join(contractsDir, name);
    const schemaDoc = readJson(filePath);
    const before = errors;
    if (!Object.prototype.hasOwnProperty.call(schemaDoc, '$defs')) {
      errors += validateSchemaMeta(ajv, name, schemaDoc);
    }
    if (errors === before) {
      console.log(`ok schema ${name}`);
    }
  }
  return errors;
}

function compileWithCommonDefs(schemaDoc) {
  const ajv = createAjv();
  if (fs.existsSync(commonDefsSchemaPath)) {
    const common = { ...readJson(commonDefsSchemaPath) };
    delete common.$schema;
    ajv.addSchema(common);
  }
  const copy = { ...schemaDoc };
  delete copy.$schema;
  return ajv.compile(copy);
}

function main() {
  const ajv = createAjv();
  const analyteSchema = readJson(paths.analyteSchema);
  const testsSchema = readJson(paths.testsSchema);
  const workupsSchema = readJson(paths.workupsSchema);

  let errors = 0;
  errors += validateAllContractSchemas(ajv);

  const validateAnalyte = compileWithCommonDefs(analyteSchema);
  const validateTests = compileWithCommonDefs(testsSchema);
  const validateWorkups = compileWithCommonDefs(workupsSchema);

  const analytes = readJson(paths.analyte);
  const tests = readJson(paths.tests);
  const workups = readJson(paths.workups);

  errors += validateAgainstSchema('analytes.json', validateAnalyte, analytes);
  errors += validateAgainstSchema('orderable-tests.json', validateTests, tests);
  errors += validateAgainstSchema('workups.json', validateWorkups, workups);

  if (fs.existsSync(paths.enums) && fs.existsSync(paths.enumsSchema)) {
    const enumsDoc = { ...readJson(paths.enums) };
    delete enumsDoc.containers;
    errors += validateAgainstSchema(
      'enums.json',
      compileDraft07(readJson(paths.enumsSchema)),
      enumsDoc,
    );
  }

  if (fs.existsSync(paths.entityIds)) {
    const entity = readJson(paths.entityIds);
    if (!entity.patterns || typeof entity.patterns !== 'object') {
      console.error('entity-ids.json: missing patterns');
      errors += 1;
    }
  }

  errors += runCatalogIntegrityChecks({ analytes, tests, workups });
  errors += runRequiredFixtureChecks({ analytes, tests });
  errors += runRejectionReasonChecks({ analytes, tests });

  if (fs.existsSync(sampleRejectionSchemaPath) && fs.existsSync(sampleRejectionPath)) {
    errors += validateAgainstSchema(
      'rejection-specimen.json',
      compileDraft07(readJson(sampleRejectionSchemaPath)),
      readJson(sampleRejectionPath),
    );
  }
  if (fs.existsSync(resultRejectionSchemaPath) && fs.existsSync(resultRejectionPath)) {
    errors += validateAgainstSchema(
      'rejection-analytical.json',
      compileDraft07(readJson(resultRejectionSchemaPath)),
      readJson(resultRejectionPath),
    );
  }

  if (errors > 0) {
    console.error(`catalog validation failed with ${errors} error(s)`);
    process.exit(1);
  }
  console.log('ok analytes.json');
  console.log('ok orderable-tests.json');
  console.log('ok workups.json');
  console.log('catalog referential integrity OK');
}

main();