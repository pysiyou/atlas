/**
 * contracts/feedback.json → frontend/src/types/generated/feedbackCatalog.ts
 */
import Ajv from 'ajv';
import fs from 'node:fs';
import path from 'node:path';
import { CONTRACTS, readJson, writeFile } from './read-contract.mjs';

export function generateFeedbackContract() {
  const jsonPath = path.join(CONTRACTS, 'feedback.json');
  if (!fs.existsSync(jsonPath)) {
    console.log('skip feedback.json');
    return;
  }
  const data = readJson('feedback.json');
  const schemaPath = path.join(CONTRACTS, 'feedback.schema.json');
  if (fs.existsSync(schemaPath)) {
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(schema);
    if (!validate(data)) {
      console.error('feedback.json validation failed:', validate.errors);
      process.exit(1);
    }
  }

  const entries = data.entries ?? {};
  const ids = Object.keys(entries).sort();
  if (ids.length === 0) {
    console.error('feedback.json has no entries');
    process.exit(1);
  }

  const idUnion = ids.map(id => JSON.stringify(id)).join('\n  | ');

  const catalogBody = ids
    .map(id => {
      const e = entries[id];
      const fields = [
        `channel: ${JSON.stringify(e.channel)}`,
        `variant: ${JSON.stringify(e.variant)}`,
        `title: ${JSON.stringify(e.title)}`,
      ];
      if (e.subtitle) fields.push(`subtitle: ${JSON.stringify(e.subtitle)}`);
      return `  ${JSON.stringify(id)}: { ${fields.join(', ')} }`;
    })
    .join(',\n');

  const ts = `/**
 * User feedback catalog — GENERATED from contracts/feedback.json. DO NOT EDIT.
 */
export type FeedbackChannel = 'toast' | 'alert' | 'errorAlert' | 'inline';
export type FeedbackVariant = 'success' | 'error' | 'warning' | 'info' | 'danger';

export type FeedbackId =
  | ${idUnion};

export interface FeedbackEntry {
  channel: FeedbackChannel;
  variant: FeedbackVariant;
  title: string;
  subtitle?: string;
}

export const FEEDBACK_CATALOG: Record<FeedbackId, FeedbackEntry> = {
${catalogBody},
};
`;

  writeFile('frontend/src/types/generated/feedbackCatalog.ts', ts);
}
