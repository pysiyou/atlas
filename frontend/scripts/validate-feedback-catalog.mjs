#!/usr/bin/env node
/**
 * Validate contracts/feedback.json and generated feedbackCatalog.ts re-export.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = join(ROOT, 'frontend/src');
const JSON_PATH = join(ROOT, 'contracts/feedback.json');
const GENERATED_PATH = join(SRC, 'types/generated/feedbackCatalog.ts');

const CHANNELS = new Set(['toast', 'inline']);
const VARIANTS = new Set(['success', 'error', 'warning', 'info', 'danger']);

const TOAST_HOST_ALLOWLIST = new Set([
  'app/App.tsx',
  'feedback/index.ts',
  'feedback/ui.tsx',
  'feedback/ErrorBoundary.tsx',
]);

function fail(message) {
  console.error(`validate-feedback-catalog: ${message}`);
  process.exitCode = 1;
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
  const patterns = [
    /from\s+['"]@\/components\/feedback\/notices['"]/,
    /from\s+['"]@\/utils\/feedback['"]/,
  ];
  for (const file of walk(SRC)) {
    const rel = relative(SRC, file).replaceAll('\\', '/');
    if (rel.startsWith('feedback/')) continue;
    const text = readFileSync(file, 'utf8');
    for (const importPattern of patterns) {
      if (!importPattern.test(text)) continue;
      fail(`Disallowed legacy feedback import in ${rel}. Use @/feedback.`);
    }
  }

  const showToastPattern = /\bshowToast\s*\(/;
  for (const file of walk(SRC)) {
    const rel = relative(SRC, file).replaceAll('\\', '/');
    const text = readFileSync(file, 'utf8');
    if (!showToastPattern.test(text)) continue;
    if (!TOAST_HOST_ALLOWLIST.has(rel)) {
      fail(`showToast is internal to feedback module; disallowed in ${rel}. Use notify.show.`);
    }
  }
}

const data = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
const entries = data.entries ?? {};
const ids = Object.keys(entries).sort();

const generated = readFileSync(GENERATED_PATH, 'utf8');
const idUnionMatch = generated.match(/export type FeedbackId =\s*([\s\S]*?);/);
if (!idUnionMatch) {
  fail('Generated feedbackCatalog.ts missing FeedbackId union.');
}

const generatedIds = [...idUnionMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map(m => m[1]);

for (const id of ids) {
  const entry = entries[id];
  if (!entry.title?.trim()) fail(`feedback.json['${id}'] is missing title.`);
  if (!CHANNELS.has(entry.channel)) {
    fail(`feedback.json['${id}'] has invalid channel '${entry.channel}'.`);
  }
  if (!VARIANTS.has(entry.variant)) {
    fail(`feedback.json['${id}'] has invalid variant '${entry.variant}'.`);
  }
  if (entry.channel === 'toast' && !entry.brief?.trim()) {
    fail(`feedback.json['${id}'] is missing brief (required for toast channel).`);
  }
}

if (ids.length !== generatedIds.length) {
  fail(`feedback.json keys (${ids.length}) !== generated FeedbackId count (${generatedIds.length}).`);
}

for (const id of ids) {
  if (!generatedIds.includes(id)) fail(`Generated FeedbackId missing '${id}'.`);
}

checkImportBoundary();

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log(`validate-feedback-catalog: ${ids.length} ids OK.`);
