#!/usr/bin/env node
/**
 * Fails when Finder-style duplicate files (* 2.ts, * 2.tsx) exist under src/.
 */
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const srcRoot = new URL('../src', import.meta.url).pathname;
const duplicates = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walk(full);
      continue;
    }
    if (/ 2\.(ts|tsx)$/.test(name)) {
      duplicates.push(full);
    }
  }
}

walk(srcRoot);

if (duplicates.length > 0) {
  console.error('Duplicate Finder copy files detected:\n' + duplicates.join('\n'));
  process.exit(1);
}

console.log('No duplicate * 2.ts(x) files under src/');
