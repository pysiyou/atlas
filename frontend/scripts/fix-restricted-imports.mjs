#!/usr/bin/env node
/**
 * Fix no-restricted-imports ESLint warnings by rewriting deep feature imports
 * to either relative paths (intra-feature) or feature barrel imports (cross-feature).
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname, extname } from 'node:path';

const SRC = join(import.meta.dirname, '../src');

const RESTRICTED_PATTERNS = [
  /^@\/features\/([^/]+)\/(components|hooks|api|utils)\/(.+)$/,
];

/** Map restricted import path to barrel import for cross-feature usage */
const BARREL_MAP = {
  '@/features/catalog/api/tests.api': '@/features/catalog',
  '@/features/patients/api/patients.api': '@/features/patients',
  '@/features/patients/api/affiliations.api': '@/features/patients',
  '@/features/patients/components/AgeFilter': '@/features/patients',
  '@/features/orders/api/orders.api': '@/features/orders',
  '@/features/orders/hooks/useOrderUtils': '@/features/orders',
  '@/features/orders/components/OrderUpsertModal': '@/features/orders',
  '@/features/orders/utils/formTransformers': '@/features/orders',
  '@/features/payments/api/payments.api': '@/features/payments',
  '@/features/payments/components/PaymentPopover': '@/features/payments',
};

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry === 'dist') continue;
      walk(full, files);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

function getFeatureFromPath(filePath) {
  const rel = relative(SRC, filePath);
  const match = rel.match(/^features\/([^/]+)\//);
  return match ? match[1] : null;
}

function toRelativeImport(fromFile, importPath) {
  const match = importPath.match(/^@\/features\/([^/]+)\/(components|hooks|api|utils)\/(.+)$/);
  if (!match) return null;

  const [, feature, category, rest] = match;
  const targetPath = join(SRC, 'features', feature, category, rest);
  const fromDir = dirname(fromFile);
  let rel = relative(fromDir, targetPath).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = './' + rel;
  // Strip .ts/.tsx extension
  rel = rel.replace(/\.(tsx?|ts)$/, '');
  return rel;
}

function fixImports(content, filePath) {
  const feature = getFeatureFromPath(filePath);
  let changed = false;

  // Match import/export from '...' statements
  const result = content.replace(
    /((?:import|export)\s+(?:type\s+)?(?:[\w*{}\s,]+)\s+from\s+['"])(@\/features\/[^'"]+)(['"])/g,
    (full, prefix, importPath, suffix) => {
      const restrictedMatch = importPath.match(/^@\/features\/([^/]+)\/(components|hooks|api|utils)\/(.+)$/);
      if (!restrictedMatch) return full;

      const importFeature = restrictedMatch[1];

      // Intra-feature: use relative import
      if (feature === importFeature) {
        const rel = toRelativeImport(filePath, importPath);
        if (rel) {
          changed = true;
          return prefix + rel + suffix;
        }
      }

      // Cross-feature: use barrel import
      if (BARREL_MAP[importPath]) {
        changed = true;
        return prefix + BARREL_MAP[importPath] + suffix;
      }

      // Lab cross-feature imports use @/features/lab barrel
      if (importFeature === 'lab') {
        changed = true;
        return prefix + '@/features/lab' + suffix;
      }

      return full;
    }
  );

  // Also handle side-effect imports: import '@/features/...'
  const result2 = result.replace(
    /(import\s+['"])(@\/features\/[^'"]+)(['"])/g,
    (full, prefix, importPath, suffix) => {
      const restrictedMatch = importPath.match(/^@\/features\/([^/]+)\/(components|hooks|api|utils)\/(.+)$/);
      if (!restrictedMatch) return full;

      const importFeature = restrictedMatch[1];

      if (feature === importFeature) {
        const rel = toRelativeImport(filePath, importPath);
        if (rel) {
          changed = true;
          return prefix + rel + suffix;
        }
      }

      if (BARREL_MAP[importPath]) {
        changed = true;
        return prefix + BARREL_MAP[importPath] + suffix;
      }

      if (importFeature === 'lab') {
        changed = true;
        return prefix + '@/features/lab' + suffix;
      }

      return full;
    }
  );

  return { content: result2, changed };
}

const files = walk(SRC);
let fixedCount = 0;

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  const { content: fixed, changed } = fixImports(content, file);
  if (changed) {
    writeFileSync(file, fixed);
    fixedCount++;
    console.log('Fixed:', relative(SRC, file));
  }
}

console.log(`\nFixed ${fixedCount} files.`);
