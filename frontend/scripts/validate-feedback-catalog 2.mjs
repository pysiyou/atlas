#!/usr/bin/env node
/**
 * Validate feedbackCatalog.ts: FeedbackId union matches FEEDBACK_CATALOG keys,
 * each entry has title + valid channel/variant, and AppToastBar imports stay allowlisted.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const CATALOG_PATH = join(SRC, 'config/feedbackCatalog.ts');

const CHANNELS = new Set(['toast', 'alert', 'errorAlert', 'inline']);
const VARIANTS = new Set(['success', 'error', 'warning', 'info', 'danger']);

const APP_TOAST_BAR_ALLOWLIST = new Set([
  'app/AppToastBar.tsx',
  'app/App.tsx',
  'utils/feedback/notify.ts',
]);

function fail(message) {
  console.error(`validate-feedback-catalog: ${message}`);
  process.exitCode = 1;
}

function extractQuotedIds(block) {
  return [...block.matchAll(/'([^']+)'/g)].map(match => match[1]);
}

function parseCatalog(source) {
  const idMatch = source.match(/export type FeedbackId =\s*([\s\S]*?);/);
  if (!idMatch) {
    fail('Could not find `export type FeedbackId`.');
    return { ids: [], entries: [] };
  }
  const ids = extractQuotedIds(idMatch[1]);

  const catalogMatch = source.match(/export const FEEDBACK_CATALOG[^=]*=\s*\{([\s\S]*)\}\s*;/);
  if (!catalogMatch) {
    fail('Could not find `export const FEEDBACK_CATALOG`.');
    return { ids, entries: [] };
  }

  const entryRegex =
    /'([^']+)':\s*\{\s*channel:\s*'([^']+)',\s*variant:\s*'([^']+)',\s*title:\s*'((?:\\'|[^'])*)'/g;
  const entries = [];
  let match;
  while ((match = entryRegex.exec(catalogMatch[1])) !== null) {
    entries.push({
      id: match[1],
      channel: match[2],
      variant: match[3],
      title: match[4],
    });
  }

  return { ids, entries };
}

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

function checkImportBoundary() {
  const importPattern = /from\s+['"]@\/app\/AppToastBar['"]/;
  for (const file of walk(SRC)) {
    const rel = relative(SRC, file).replaceAll('\\', '/');
    const text = readFileSync(file, 'utf8');
    if (!importPattern.test(text)) continue;
    if (!APP_TOAST_BAR_ALLOWLIST.has(rel)) {
      fail(`Disallowed AppToastBar import in ${rel}. Use @/utils/feedback instead.`);
    }
  }
}

const source = readFileSync(CATALOG_PATH, 'utf8');
const { ids, entries } = parseCatalog(source);

if (ids.length === 0) {
  fail('FeedbackId union is empty.');
}

const idSet = new Set(ids);
const keySet = new Set(entries.map(entry => entry.id));

for (const id of ids) {
  if (!keySet.has(id)) fail(`FeedbackId '${id}' is missing from FEEDBACK_CATALOG.`);
}

for (const entry of entries) {
  if (!idSet.has(entry.id)) fail(`FEEDBACK_CATALOG key '${entry.id}' is not in FeedbackId.`);
  if (!entry.title.trim()) fail(`FEEDBACK_CATALOG['${entry.id}'] is missing title.`);
  if (!CHANNELS.has(entry.channel)) {
    fail(`FEEDBACK_CATALOG['${entry.id}'] has invalid channel '${entry.channel}'.`);
  }
  if (!VARIANTS.has(entry.variant)) {
    fail(`FEEDBACK_CATALOG['${entry.id}'] has invalid variant '${entry.variant}'.`);
  }
}

if (ids.length !== keySet.size) {
  fail(`FeedbackId count (${ids.length}) !== catalog keys (${keySet.size}).`);
}

const titles = new Map();
for (const entry of entries) {
  const existing = titles.get(entry.title) ?? [];
  existing.push(entry.id);
  titles.set(entry.title, existing);
}
for (const [title, titleIds] of titles) {
  if (titleIds.length > 1) {
    console.warn(
      `validate-feedback-catalog: duplicate title ${JSON.stringify(title)} used by ${titleIds.join(', ')}`
    );
  }
}

checkImportBoundary();

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log(`validate-feedback-catalog: ${ids.length} ids OK.`);
