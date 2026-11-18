#!/usr/bin/env node
/**
 * Apply published core chemistry/heme reference intervals (user + LOINC-aligned),
 * trim analyte-catalog to 200 analytes, prune orderable-tests analyte FKs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const analytePath = path.join(root, 'contracts/catalog/analyte-catalog.json');
const testsPath = path.join(root, 'contracts/catalog/orderable-tests.json');

const MAX_ANALYTES = 200;

/** @typedef {{ code: string; loinc: string; name: string; unit: string; specimen: string; refLow?: number|null; refHigh?: number|null; critLow?: number|null; critHigh?: number|null; decimals?: number }} Spec */

/** @type {Spec[]} */
const CORE_SPECS = [
  { code: 'WBC', loinc: '6690-2', name: 'White blood cell count', unit: '10^3/uL', specimen: 'Whole Blood', refLow: 4.0, refHigh: 10.5, critLow: 1.5, critHigh: 50.0, decimals: 2 },
  { code: 'RBC', loinc: '789-8', name: 'Red blood cell count', unit: '10^6/uL', specimen: 'Whole Blood', refLow: 4.2, refHigh: 5.9, decimals: 2 },
  { code: 'HGB', loinc: '718-7', name: 'Hemoglobin', unit: 'g/dL', specimen: 'Whole Blood', refLow: 12.5, refHigh: 17.5, critLow: 7.0, critHigh: 20.0, decimals: 1 },
  { code: 'HCT', loinc: '4544-3', name: 'Hematocrit', unit: '%', specimen: 'Whole Blood', refLow: 37.0, refHigh: 52.0, critLow: 20.0, critHigh: 60.0, decimals: 1 },
  { code: 'MCV', loinc: '787-2', name: 'Mean corpuscular volume', unit: 'fL', specimen: 'Whole Blood', refLow: 80.0, refHigh: 100.0, decimals: 1 },
  { code: 'MCH', loinc: '785-6', name: 'Mean corpuscular hemoglobin', unit: 'pg', specimen: 'Whole Blood', refLow: 27.0, refHigh: 33.0, decimals: 1 },
  { code: 'MCHC', loinc: '786-4', name: 'Mean corpuscular hemoglobin concentration', unit: 'g/dL', specimen: 'Whole Blood', refLow: 32.0, refHigh: 36.0, decimals: 1 },
  { code: 'RDW', loinc: '788-0', name: 'Red cell distribution width', unit: '%', specimen: 'Whole Blood', refLow: 11.5, refHigh: 14.5, decimals: 1 },
  { code: 'PLAT', loinc: '777-3', name: 'Platelet count', unit: '10^3/uL', specimen: 'Whole Blood', refLow: 150, refHigh: 450, critLow: 30, critHigh: 1000, decimals: 0 },
  { code: 'MPV', loinc: '32623-1', name: 'Mean platelet volume', unit: 'fL', specimen: 'Whole Blood', refLow: 7.5, refHigh: 11.5, decimals: 1 },
  { code: 'NEUTA', loinc: '751-8', name: 'Neutrophils absolute count', unit: '10^3/uL', specimen: 'Whole Blood', refLow: 1.8, refHigh: 7.7, critLow: 0.5, decimals: 2 },
  { code: 'LYMPHA', loinc: '731-0', name: 'Lymphocytes absolute count', unit: '10^3/uL', specimen: 'Whole Blood', refLow: 1.0, refHigh: 4.8, decimals: 2 },
  { code: 'MONOA', loinc: '742-7', name: 'Monocytes absolute count', unit: '10^3/uL', specimen: 'Whole Blood', refLow: 0.2, refHigh: 0.8, decimals: 2 },
  { code: 'EOSA', loinc: '711-2', name: 'Eosinophils absolute count', unit: '10^3/uL', specimen: 'Whole Blood', refLow: 0.0, refHigh: 0.5, decimals: 2 },
  { code: 'BASOA', loinc: '704-7', name: 'Basophils absolute count', unit: '10^3/uL', specimen: 'Whole Blood', refLow: 0.0, refHigh: 0.2, decimals: 2 },
  { code: 'GLU', loinc: '2345-7', name: 'Glucose fasting', unit: 'mg/dL', specimen: 'Serum', refLow: 70, refHigh: 99, critLow: 45, critHigh: 450, decimals: 0 },
  { code: 'BUN', loinc: '3094-0', name: 'Blood urea nitrogen', unit: 'mg/dL', specimen: 'Serum', refLow: 7, refHigh: 20, critHigh: 100, decimals: 0 },
  { code: 'CREA', loinc: '2160-0', name: 'Creatinine', unit: 'mg/dL', specimen: 'Serum', refLow: 0.6, refHigh: 1.3, critHigh: 6.0, decimals: 2 },
  { code: 'EGFR', loinc: '33914-3', name: 'Glomerular filtration rate CKD-EPI', unit: 'mL/min/1.73m2', specimen: 'Serum', refLow: 60, critLow: 15, decimals: 0 },
  { code: 'NA', loinc: '2951-2', name: 'Sodium', unit: 'mmol/L', specimen: 'Serum', refLow: 136, refHigh: 145, critLow: 120, critHigh: 160, decimals: 0 },
  { code: 'K', loinc: '2823-3', name: 'Potassium', unit: 'mmol/L', specimen: 'Serum', refLow: 3.5, refHigh: 5.1, critLow: 2.8, critHigh: 6.2, decimals: 1 },
  { code: 'CL', loinc: '2075-0', name: 'Chloride', unit: 'mmol/L', specimen: 'Serum', refLow: 98, refHigh: 107, critLow: 80, critHigh: 120, decimals: 0 },
  { code: 'CO2', loinc: '2028-9', name: 'Bicarbonate', unit: 'mmol/L', specimen: 'Serum', refLow: 22, refHigh: 29, critLow: 10, critHigh: 40, decimals: 0 },
  { code: 'CA', loinc: '17861-6', name: 'Calcium total', unit: 'mg/dL', specimen: 'Serum', refLow: 8.6, refHigh: 10.2, critLow: 6.5, critHigh: 13.0, decimals: 1 },
  { code: 'MG', loinc: '19123-9', name: 'Magnesium', unit: 'mg/dL', specimen: 'Serum', refLow: 1.7, refHigh: 2.4, critLow: 1.0, critHigh: 4.5, decimals: 1 },
  { code: 'PHOS', loinc: '2777-1', name: 'Phosphorus', unit: 'mg/dL', specimen: 'Serum', refLow: 2.5, refHigh: 4.5, critLow: 1.0, critHigh: 9.0, decimals: 1 },
  { code: 'URIC', loinc: '3084-1', name: 'Uric acid', unit: 'mg/dL', specimen: 'Serum', refLow: 3.5, refHigh: 7.2, decimals: 1 },
  { code: 'LACT', loinc: '2524-7', name: 'Lactate', unit: 'mmol/L', specimen: 'Plasma', refLow: 0.5, refHigh: 2.2, critHigh: 4.0, decimals: 1 },
  { code: 'AST', loinc: '1920-8', name: 'Aspartate aminotransferase', unit: 'U/L', specimen: 'Serum', refLow: 10, refHigh: 40, critHigh: 1000, decimals: 0 },
  { code: 'ALT', loinc: '1742-6', name: 'Alanine aminotransferase', unit: 'U/L', specimen: 'Serum', refLow: 7, refHigh: 56, critHigh: 1000, decimals: 0 },
  { code: 'ALP', loinc: '6768-6', name: 'Alkaline phosphatase', unit: 'U/L', specimen: 'Serum', refLow: 44, refHigh: 147, decimals: 0 },
  { code: 'GGT', loinc: '2324-2', name: 'Gamma glutamyl transferase', unit: 'U/L', specimen: 'Serum', refLow: 8, refHigh: 61, decimals: 0 },
  { code: 'TBIL', loinc: '1975-2', name: 'Bilirubin total', unit: 'mg/dL', specimen: 'Serum', refLow: 0.1, refHigh: 1.2, critHigh: 15.0, decimals: 1 },
  { code: 'DBIL', loinc: '1968-7', name: 'Bilirubin direct', unit: 'mg/dL', specimen: 'Serum', refLow: 0.0, refHigh: 0.3, decimals: 2 },
  { code: 'TP', loinc: '2885-2', name: 'Protein total', unit: 'g/dL', specimen: 'Serum', refLow: 6.0, refHigh: 8.3, decimals: 1 },
  { code: 'ALB', loinc: '1751-7', name: 'Albumin', unit: 'g/dL', specimen: 'Serum', refLow: 3.5, refHigh: 5.0, critLow: 1.5, decimals: 1 },
  { code: 'AMYL', loinc: '1798-8', name: 'Amylase', unit: 'U/L', specimen: 'Serum', refLow: 30, refHigh: 110, critHigh: 500, decimals: 0 },
  { code: 'LIPA', loinc: '3040-3', name: 'Lipase', unit: 'U/L', specimen: 'Serum', refLow: 13, refHigh: 60, critHigh: 300, decimals: 0 },
  { code: 'CHOL', loinc: '2093-3', name: 'Cholesterol total', unit: 'mg/dL', specimen: 'Serum', refHigh: 200, decimals: 0 },
  { code: 'HDL', loinc: '2085-9', name: 'HDL cholesterol', unit: 'mg/dL', specimen: 'Serum', refLow: 40, decimals: 0 },
  { code: 'LDL', loinc: '13457-7', name: 'LDL cholesterol', unit: 'mg/dL', specimen: 'Serum', refHigh: 100, decimals: 0 },
  { code: 'TRIG', loinc: '2571-8', name: 'Triglycerides', unit: 'mg/dL', specimen: 'Serum', refHigh: 150, critHigh: 1000, decimals: 0 },
  { code: 'HBA1C', loinc: '4548-4', name: 'Hemoglobin A1c', unit: '%', specimen: 'Whole Blood', refLow: 4.0, refHigh: 5.6, critHigh: 14.0, decimals: 1 },
  { code: 'PT', loinc: '5902-2', name: 'Prothrombin time', unit: 's', specimen: 'Plasma', refLow: 11.0, refHigh: 13.5, critHigh: 40.0, decimals: 1 },
  { code: 'INR', loinc: '6301-6', name: 'INR', unit: 'ratio', specimen: 'Plasma', refLow: 0.8, refHigh: 1.2, critHigh: 5.0, decimals: 2 },
  { code: 'APTT', loinc: '14979-9', name: 'Activated partial thromboplastin time', unit: 's', specimen: 'Plasma', refLow: 25, refHigh: 35, critHigh: 100, decimals: 0 },
  { code: 'FIB', loinc: '3255-7', name: 'Fibrinogen', unit: 'mg/dL', specimen: 'Plasma', refLow: 200, refHigh: 400, critLow: 100, decimals: 0 },
  { code: 'DDIM', loinc: '48065-7', name: 'D-dimer', unit: 'ng/mL', specimen: 'Plasma', refHigh: 500, decimals: 0 },
  { code: 'TROP', loinc: '6598-7', name: 'High-sensitivity troponin T', unit: 'ng/L', specimen: 'Serum', refHigh: 14, critHigh: 52, decimals: 1 },
  { code: 'BNP', loinc: '30934-4', name: 'NT-proBNP', unit: 'pg/mL', specimen: 'Serum', refHigh: 125, decimals: 0 },
  { code: 'CK', loinc: '2157-6', name: 'Creatine kinase', unit: 'U/L', specimen: 'Serum', refLow: 30, refHigh: 200, critHigh: 5000, decimals: 0 },
  { code: 'IRON', loinc: '2498-4', name: 'Iron', unit: 'ug/dL', specimen: 'Serum', refLow: 50, refHigh: 170, decimals: 0 },
  { code: 'FERR', loinc: '2276-4', name: 'Ferritin', unit: 'ng/mL', specimen: 'Serum', refLow: 20, refHigh: 300, decimals: 0 },
  { code: 'TIBC', loinc: '2500-7', name: 'Total iron binding capacity', unit: 'ug/dL', specimen: 'Serum', refLow: 250, refHigh: 450, decimals: 0 },
  { code: 'B12', loinc: '2132-9', name: 'Vitamin B12', unit: 'pg/mL', specimen: 'Serum', refLow: 200, refHigh: 900, decimals: 0 },
  { code: 'TSH', loinc: '3016-3', name: 'Thyroid stimulating hormone', unit: 'mIU/L', specimen: 'Serum', refLow: 0.4, refHigh: 4.0, critLow: 0.05, critHigh: 50.0, decimals: 2 },
  { code: 'FT4', loinc: '3024-7', name: 'Free thyroxine', unit: 'ng/dL', specimen: 'Serum', refLow: 0.8, refHigh: 1.8, critLow: 0.3, critHigh: 5.0, decimals: 2 },
  { code: 'FT3', loinc: '3051-0', name: 'Free triiodothyronine', unit: 'pg/mL', specimen: 'Serum', refLow: 2.3, refHigh: 4.2, decimals: 1 },
  { code: 'CRP', loinc: '1988-5', name: 'C-reactive protein', unit: 'mg/L', specimen: 'Serum', refHigh: 5.0, decimals: 1 },
];

const FIXTURE_ANALYTES = ['WBC', 'HGB', 'PLAT', 'TSH', 'RBC', 'HCT'];

/**
 * @param {Spec} spec
 * @param {string[]} rejectionCriteria
 */
function buildAnalyteFromSpec(spec, rejectionCriteria) {
  /** @type {Record<string, { low?: number; high?: number }>} */
  const adult = {};
  if (spec.refLow != null) adult.low = spec.refLow;
  if (spec.refHigh != null) adult.high = spec.refHigh;

  /** @type {Record<string, number>} */
  const critical = {};
  if (spec.critLow != null) critical.low = spec.critLow;
  if (spec.critHigh != null) critical.high = spec.critHigh;

  const refLow = spec.refLow ?? spec.critLow ?? 0;
  const refHigh = spec.refHigh ?? spec.critHigh ?? (refLow > 0 ? refLow * 10 : 100);
  const physMin = spec.critLow != null ? Math.min(spec.critLow, refLow) * 0.5 : refLow * 0.25;
  const physMax = spec.critHigh != null ? Math.max(spec.critHigh, refHigh) * 1.5 : refHigh * 3;

  /** @type {Record<string, unknown>} */
  const row = {
    analyte_code: spec.code,
    loinc_code: spec.loinc,
    name: spec.name,
    specimen: spec.specimen,
    value_type: 'NUMERIC',
    unit: spec.unit,
    decimals_suggested: spec.decimals ?? 1,
    reference_range: { adult_general: adult },
    physiologic_range: { min: Math.round(physMin * 1000) / 1000, max: Math.round(physMax * 1000) / 1000 },
    citations: ['SRC002', 'SRC003'],
    validation: { rejection_criteria: rejectionCriteria },
  };
  if (Object.keys(critical).length) row.critical_range = critical;
  return row;
}

/**
 * @param {Record<string, unknown>} row
 * @param {Spec} spec
 */
function applySpecToRow(row, spec) {
  Object.assign(row, buildAnalyteFromSpec(spec, /** @type {string[]} */ (row.validation?.rejection_criteria)));
}

function main() {
  const catalog = JSON.parse(fs.readFileSync(analytePath, 'utf8'));
  const testsDoc = JSON.parse(fs.readFileSync(testsPath, 'utf8'));

  const rejectionCriteria =
    catalog.analytes.find(a => a.analyte_code === 'HGB')?.validation?.rejection_criteria ??
    catalog.analytes[0]?.validation?.rejection_criteria;
  if (!rejectionCriteria?.length) throw new Error('missing rejection_criteria template');

  const byCode = new Map(catalog.analytes.map(a => [a.analyte_code, a]));

  for (const spec of CORE_SPECS) {
    const existing = byCode.get(spec.code);
    if (existing) applySpecToRow(existing, spec);
    else {
      const created = buildAnalyteFromSpec(spec, rejectionCriteria);
      catalog.analytes.push(created);
      byCode.set(spec.code, created);
    }
  }

  const priority = new Set([...CORE_SPECS.map(s => s.code), ...FIXTURE_ANALYTES]);

  const freq = new Map();
  for (const t of testsDoc.tests ?? []) {
    for (const ac of t.analytes ?? []) freq.set(ac, (freq.get(ac) ?? 0) + 1);
  }

  /** @type {string[]} */
  const keep = [...priority];
  const ranked = [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  for (const code of ranked) {
    if (keep.length >= MAX_ANALYTES) break;
    if (!keep.includes(code) && byCode.has(code)) keep.push(code);
  }

  const keepSet = new Set(keep.slice(0, MAX_ANALYTES));
  catalog.analytes = catalog.analytes
    .filter(a => keepSet.has(a.analyte_code))
    .sort((a, b) => String(a.analyte_code).localeCompare(String(b.analyte_code)));

  let prunedRefs = 0;
  let emptyTests = 0;
  for (const t of testsDoc.tests ?? []) {
    const before = t.analytes?.length ?? 0;
    t.analytes = (t.analytes ?? []).filter(ac => keepSet.has(ac));
    prunedRefs += before - t.analytes.length;
    if (t.analytes.length < 1) emptyTests += 1;
  }

  fs.writeFileSync(analytePath, `${JSON.stringify(catalog, null, 2)}\n`);
  if (process.env.PATCH_ORDERABLE_TESTS === '1') {
    fs.writeFileSync(testsPath, `${JSON.stringify(testsDoc, null, 2)}\n`);
  }

  console.log(`analytes: ${catalog.analytes.length} (max ${MAX_ANALYTES})`);
  console.log(`core specs applied: ${CORE_SPECS.length}`);
  console.log(`orderable analyte refs pruned (dry): ${prunedRefs}; tests with 0 analytes: ${emptyTests}`);
  console.log('Set PATCH_ORDERABLE_TESTS=1 to write orderable-tests.json');
}

main();