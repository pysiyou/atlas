#!/usr/bin/env node
/**
 * Generate frontend/src/types/generated/feedback.ts from contracts/feedback.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const feedbackPath = path.join(root, 'contracts', 'feedback.json');
const outPath = path.join(root, 'frontend', 'src', 'types', 'generated', 'feedback.ts');

const data = JSON.parse(fs.readFileSync(feedbackPath, 'utf-8'));
const entries = data.entries;
if (!entries || typeof entries !== 'object') {
  console.error('feedback.json must have an "entries" object');
  process.exit(1);
}

const ids = Object.keys(entries).sort();

function formatEntry(id) {
  const e = entries[id];
  const parts = [
    `channel: ${JSON.stringify(e.channel)}`,
    `variant: ${JSON.stringify(e.variant)}`,
    `title: ${JSON.stringify(e.title)}`,
  ];
  if (e.subtitle != null) {
    parts.push(`subtitle: ${JSON.stringify(e.subtitle)}`);
  }
  if (e.brief != null) {
    parts.push(`brief: ${JSON.stringify(e.brief)}`);
  }
  return `  ${JSON.stringify(id)}: { ${parts.join(', ')} },`;
}

const typeUnion = ids.map(id => `  | ${JSON.stringify(id)}`).join('\n');
const catalogBody = ids.map(formatEntry).join('\n');

const output = `/**
 * User feedback catalog — GENERATED from contracts/feedback.json. DO NOT EDIT.
 */
export type FeedbackChannel = 'toast' | 'inline';
export type FeedbackVariant = 'success' | 'error' | 'warning' | 'info' | 'danger';

export type FeedbackId =
${typeUnion};

export interface FeedbackEntry {
  channel: FeedbackChannel;
  variant: FeedbackVariant;
  title: string;
  subtitle?: string;
  brief?: string;
}

export const FEEDBACK_CATALOG: Record<FeedbackId, FeedbackEntry> = {
${catalogBody}
};
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, output, 'utf-8');
console.log(`Wrote ${path.relative(root, outPath)} (${ids.length} entries)`);