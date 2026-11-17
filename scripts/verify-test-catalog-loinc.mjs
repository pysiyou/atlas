#!/usr/bin/env node
/**
 * Verify every catalog LOINC against NLM Clinical Tables API (live lookup).
 * Exits non-zero when any code is not found.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const catalogPath = path.join(root, 'contracts', 'catalog', 'test-catalog.json');

/** LOINC.org-valid codes that NLM exact-code search does not return (e.g. 600-7). */
const NLM_INDEX_GAPS = new Map([['600-7', 'Bacteria identified in Blood by Culture']]);

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

/** @type {Map<string, {ctx: string, name: string}>} */
const loincs = new Map();

for (const test of catalog.tests ?? []) {
  const code = test.test_code ?? '(unknown)';
  if (test.loinc_code) {
    loincs.set(test.loinc_code, {
      ctx: code,
      name: test.display_name ?? code,
    });
  }
  for (const item of test.result_items ?? []) {
    if (!item?.loinc_code) {
      continue;
    }
    const itemCode = item.item_code ?? '(item)';
    loincs.set(item.loinc_code, {
      ctx: `${code}/${itemCode}`,
      name: item.item_name ?? itemCode,
    });
  }
}

/**
 * @param {string} loinc
 * @returns {Promise<{ok: boolean, loincName?: string}>}
 */
async function lookupLoinc(loinc) {
  const url = `https://clinicaltables.nlm.nih.gov/api/loinc_items/v3/search?terms=${encodeURIComponent(loinc)}&maxList=3`;
  const res = await fetch(url);
  if (!res.ok) {
    return { ok: false };
  }
  const body = await res.json();
  const codes = body[1] ?? [];
  if (!codes.includes(loinc)) {
    if (NLM_INDEX_GAPS.has(loinc)) {
      return { ok: true, loincName: NLM_INDEX_GAPS.get(loinc) };
    }
    return { ok: false };
  }
  const idx = codes.indexOf(loinc);
  const names = body[3] ?? [];
  return { ok: true, loincName: names[idx]?.[0] };
}

const entries = [...loincs.entries()];
let errors = 0;

for (let i = 0; i < entries.length; i++) {
  const [loinc, meta] = entries[i];
  const { ok, loincName } = await lookupLoinc(loinc);
  if (!ok) {
    console.error(`NOT FOUND: ${loinc} (${meta.ctx}) — ${meta.name}`);
    errors += 1;
  } else if (i < 5 || i === entries.length - 1) {
    console.log(`ok ${loinc} ${meta.ctx}: ${loincName}`);
  }
  if (i % 25 === 24) {
    await new Promise(r => setTimeout(r, 150));
  }
}

console.log(`Checked ${entries.length} unique LOINC code(s)`);
if (errors > 0) {
  console.error(`LOINC verification failed: ${errors} not found`);
  process.exit(1);
}
console.log('All catalog LOINCs verified online (NLM)');