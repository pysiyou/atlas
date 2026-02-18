import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

// ─── Hook-to-feature mapping ───────────────────────────────────────────────────
const hookToFeature = {
  // catalog
  useTestCatalog: '@/features/catalog/api/useTestCatalog',
  useTest: '@/features/catalog/api/useTestCatalog',
  useTestSearch: '@/features/catalog/api/useTestCatalog',
  useTestsByCategory: '@/features/catalog/api/useTestCatalog',
  useActiveTests: '@/features/catalog/api/useTestCatalog',
  useTestNameLookup: '@/features/catalog/api/useTestCatalog',
  useInvalidateTestCatalog: '@/features/catalog/api/useTestCatalog',
  // admin
  useUsersList: '@/features/admin/api/useUsers',
  useUsersMap: '@/features/admin/api/useUsers',
  useUserLookup: '@/features/admin/api/useUsers',
  useUser: '@/features/admin/api/useUsers',
  useInvalidateUsers: '@/features/admin/api/useUsers',
  UserDisplayInfo: '@/features/admin/api/useUsers',
  // patients
  usePatientsList: '@/features/patients/api/usePatients',
  usePatient: '@/features/patients/api/usePatients',
  usePatientSearch: '@/features/patients/api/usePatients',
  usePatientNameLookup: '@/features/patients/api/usePatients',
  useCreatePatient: '@/features/patients/api/usePatients',
  useUpdatePatient: '@/features/patients/api/usePatients',
  useDeletePatient: '@/features/patients/api/usePatients',
  useInvalidatePatients: '@/features/patients/api/usePatients',
  useAffiliationPricing: '@/features/patients/api/useAffiliationPricing',
  usePatientContextList: '@/features/patients/api/usePatientContext',
  // orders - queries
  useOrdersList: '@/features/orders/api/useOrderQueries',
  useOrder: '@/features/orders/api/useOrderQueries',
  useOrdersByPatient: '@/features/orders/api/useOrderQueries',
  useOrdersByStatus: '@/features/orders/api/useOrderQueries',
  useOrderSearch: '@/features/orders/api/useOrderQueries',
  useOrderLookup: '@/features/orders/api/useOrderQueries',
  useInvalidateOrders: '@/features/orders/api/useOrderQueries',
  OrdersFilters: '@/features/orders/api/useOrderQueries',
  // orders - mutations
  useCreateOrder: '@/features/orders/api/useOrderMutations',
  useUpdateOrder: '@/features/orders/api/useOrderMutations',
  useDeleteOrder: '@/features/orders/api/useOrderMutations',
  useUpdateTestStatus: '@/features/orders/api/useOrderMutations',
  useUpdatePaymentStatus: '@/features/orders/api/useOrderMutations',
  useMarkTestCritical: '@/features/orders/api/useOrderMutations',
  // collection
  useSamplesList: '@/features/collection/api/useSamples',
  useSample: '@/features/collection/api/useSamples',
  useSamplesByOrder: '@/features/collection/api/useSamples',
  useSamplesByStatus: '@/features/collection/api/useSamples',
  usePendingSamples: '@/features/collection/api/useSamples',
  useSampleLookup: '@/features/collection/api/useSamples',
  useCollectSample: '@/features/collection/api/useSamples',
  useRejectSample: '@/features/collection/api/useSamples',
  useRequestRecollection: '@/features/collection/api/useSamples',
  useInvalidateSamples: '@/features/collection/api/useSamples',
  SamplesFilters: '@/features/collection/api/useSamples',
  // billing
  usePaymentsList: '@/features/billing/api/usePayments',
  usePayment: '@/features/billing/api/usePayments',
  usePaymentsByOrder: '@/features/billing/api/usePayments',
  usePaymentMethodByOrder: '@/features/billing/api/usePayments',
  useCreatePayment: '@/features/billing/api/usePayments',
  useInvalidatePayments: '@/features/billing/api/usePayments',
  PaymentsFilters: '@/features/billing/api/usePayments',
  CreatePaymentData: '@/features/billing/api/usePayments',
  // validation
  usePendingEscalation: '@/features/validation/api/usePendingEscalation',
  useResultMutations: '@/features/validation/api/useResultMutations',
  useEnterResult: '@/features/validation/api/useResultMutations',
  useValidateResult: '@/features/validation/api/useResultMutations',
};

// Canonical feature path order for deterministic output
const featureOrder = [
  '@/features/catalog/api/useTestCatalog',
  '@/features/admin/api/useUsers',
  '@/features/patients/api/usePatients',
  '@/features/patients/api/useAffiliationPricing',
  '@/features/patients/api/usePatientContext',
  '@/features/orders/api/useOrderQueries',
  '@/features/orders/api/useOrderMutations',
  '@/features/collection/api/useSamples',
  '@/features/billing/api/usePayments',
  '@/features/validation/api/usePendingEscalation',
  '@/features/validation/api/useResultMutations',
];

// ─── Walk src/ recursively ─────────────────────────────────────────────────────
function walkDir(dir, results = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walkDir(full, results);
    } else {
      const ext = extname(full);
      if (ext === '.ts' || ext === '.tsx') results.push(full);
    }
  }
  return results;
}

// ─── Parse a single import block from @/hooks/queries ─────────────────────────
// Returns array of { name, isType }
function parseImportedNames(importBlock) {
  // Extract the { ... } portion
  const braceMatch = importBlock.match(/\{([^}]+)\}/s);
  if (!braceMatch) return [];
  const inner = braceMatch[1];

  const names = [];
  // Split on commas, handle trailing commas
  for (const token of inner.split(',')) {
    const trimmed = token.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('type ')) {
      names.push({ name: trimmed.slice(5).trim(), isType: true });
    } else {
      names.push({ name: trimmed, isType: false });
    }
  }
  return names;
}

// ─── Main migration logic ──────────────────────────────────────────────────────
const srcDir = '/Users/psiyou/Desktop/Atlas/frontend/src';
const files = walkDir(srcDir);

let modifiedCount = 0;
const skippedFiles = [];
const errors = [];

// Regex that matches one import block ending with from '@/hooks/queries'
// Handles both single-line and multi-line forms.
// Uses a non-greedy match for the brace content.
const IMPORT_RE = /import\s+\{[^}]*?\}\s+from\s+['"]@\/hooks\/queries['"]\s*;?/gs;

for (const filePath of files) {
  let source;
  try {
    source = readFileSync(filePath, 'utf8');
  } catch (e) {
    errors.push(`Read error: ${filePath}: ${e.message}`);
    continue;
  }

  // Quick check — does this file import from @/hooks/queries at all?
  if (!source.includes("'@/hooks/queries'") && !source.includes('"@/hooks/queries"')) {
    continue;
  }

  // Collect all import blocks for this file
  const matches = [...source.matchAll(IMPORT_RE)];
  if (matches.length === 0) {
    console.warn(`  WARN: ${filePath} contains @/hooks/queries but no import blocks matched — skipping`);
    continue;
  }

  // Collect all imported names across every @/hooks/queries block in this file
  let allNames = []; // { name, isType }
  for (const m of matches) {
    allNames = allNames.concat(parseImportedNames(m[0]));
  }

  // Deduplicate by name (keep isType=true if any occurrence is type)
  const nameMap = new Map();
  for (const { name, isType } of allNames) {
    if (!nameMap.has(name)) {
      nameMap.set(name, isType);
    } else if (isType) {
      nameMap.set(name, true); // upgrade to type
    }
  }

  // Check all names are in the mapping
  let hasUnmapped = false;
  for (const name of nameMap.keys()) {
    if (!hookToFeature[name]) {
      console.warn(`  UNMAPPED: '${name}' in ${filePath} — skipping file`);
      hasUnmapped = true;
    }
  }
  if (hasUnmapped) {
    skippedFiles.push(filePath);
    continue;
  }

  // Group names by target feature path, preserving isType
  // Map: featurePath -> [{ name, isType }]
  const groups = new Map();
  for (const [name, isType] of nameMap.entries()) {
    const target = hookToFeature[name];
    if (!groups.has(target)) groups.set(target, []);
    groups.get(target).push({ name, isType });
  }

  // Build replacement import lines (sorted by featureOrder, then names alphabetically)
  const replacementLines = [];
  for (const fp of featureOrder) {
    if (!groups.has(fp)) continue;
    const entries = groups.get(fp);
    // Sort names: types last, then alphabetically within each group
    entries.sort((a, b) => {
      if (a.isType !== b.isType) return a.isType ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
    const specifiers = entries.map(({ name, isType }) => (isType ? `type ${name}` : name)).join(', ');
    replacementLines.push(`import { ${specifiers} } from '${fp}';`);
  }

  // Replace all @/hooks/queries import blocks in the source
  // Strategy: replace the FIRST match with ALL replacement lines joined by newlines,
  // and remove subsequent matches (they all get folded into the first).
  let newSource = source;
  let isFirst = true;
  // We need to iterate from last to first to preserve offsets
  const sortedMatches = [...matches].sort((a, b) => b.index - a.index);
  for (const m of sortedMatches) {
    const start = m.index;
    const end = start + m[0].length;
    if (isFirst) {
      // The "first" in reverse order is actually the LAST match — swap strategy:
      // We want to keep only one occurrence. Let's replace the first match with
      // all lines and delete the rest.
      // But iterating in reverse means the last match gets the content first.
      // Instead: replace last occurrence (end of file) with empty, first with content.
      // Actually simpler: replace this (last in file) with '' and handle the first separately.
      newSource = newSource.slice(0, start) + '' + newSource.slice(end);
      isFirst = false;
    } else {
      // This is actually the first (topmost) match in the file
      newSource = newSource.slice(0, start) + replacementLines.join('\n') + newSource.slice(end);
    }
  }

  // Edge case: only one match — handle it
  if (matches.length === 1) {
    const m = matches[0];
    newSource = source.slice(0, m.index) + replacementLines.join('\n') + source.slice(m.index + m[0].length);
  }

  // Clean up any blank lines that may have been left by removed import blocks
  // (replace 3+ consecutive blank lines with 2)
  newSource = newSource.replace(/\n{3,}/g, '\n\n');

  if (newSource === source) {
    console.warn(`  NO-CHANGE: ${filePath}`);
    continue;
  }

  try {
    writeFileSync(filePath, newSource, 'utf8');
    console.log(`  MODIFIED: ${filePath}`);
    modifiedCount++;
  } catch (e) {
    errors.push(`Write error: ${filePath}: ${e.message}`);
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log('\n=== Migration Summary ===');
console.log(`Files modified: ${modifiedCount}`);
if (skippedFiles.length > 0) {
  console.log(`\nSkipped (unmapped names):`);
  for (const f of skippedFiles) console.log(`  ${f}`);
} else {
  console.log('Skipped: 0');
}
if (errors.length > 0) {
  console.log(`\nErrors:`);
  for (const e of errors) console.log(`  ${e}`);
} else {
  console.log('Errors: 0');
}
