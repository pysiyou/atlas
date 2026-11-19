#!/usr/bin/env node
/**
 * Generate enums.ts / enums.py from contracts/enums.json (including containers).
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const enumsPath = path.join(root, 'contracts', 'enums.json');
const tsOut = path.join(root, 'frontend', 'src', 'types', 'generated', 'enums.ts');
const pyOut = path.join(root, 'backend', 'app', 'shared', 'generated', 'enums.py');

const doc = JSON.parse(fs.readFileSync(enumsPath, 'utf8'));
const containers = doc.containers;
delete doc.containers;
delete doc.$schema;

const RESERVED = new Set(['$schema', 'containers']);

function pyQuote(v) {
  return JSON.stringify(v);
}

/** @param {string} enumName */
function toConstPrefix(enumName) {
  return enumName.replace(/([a-z])([A-Z])/g, '$1_$2').replace(/-/g, '_').toUpperCase();
}

/** @param {Record<string, Record<string, unknown>>} members */
function buildConfigTypeLiteral(members) {
  const memberList = Object.values(members);
  const keys = new Set();
  for (const member of memberList) {
    for (const key of Object.keys(member)) {
      if (key !== 'wire') keys.add(key);
    }
  }
  const sorted = [...keys].sort();
  if (sorted.length === 0) return 'Record<string, never>';
  const fields = sorted.map(key => {
    const types = new Set();
    let present = 0;
    for (const member of memberList) {
      if (Object.prototype.hasOwnProperty.call(member, key)) {
        present += 1;
        const v = member[key];
        if (typeof v === 'number') types.add('number');
        else if (typeof v === 'boolean') types.add('boolean');
        else types.add('string');
      }
    }
    const tsType = types.size === 1 ? [...types][0] : 'string';
    const optional = present < memberList.length;
    return `${key}${optional ? '?' : ''}: ${tsType}`;
  });
  return `{ ${fields.join('; ')} }`;
}

const pyLines = [
  '"""',
  'Enum types — GENERATED from contracts/enums.json. DO NOT EDIT.',
  '"""',
  'import enum',
  '',
];

const tsParts = [
  '/** GENERATED — DO NOT EDIT. Source: contracts/enums.json */',
  '',
];

for (const [enumName, def] of Object.entries(doc)) {
  if (RESERVED.has(enumName) || !def?.members) continue;
  const prefix = toConstPrefix(enumName);
  const wireType = def.type === 'int' ? 'int' : 'str';
  const pyBase = wireType === 'int' ? 'int, enum.Enum' : 'str, enum.Enum';

  pyLines.push(`class ${enumName}(${pyBase}):`);
  const wires = [];
  for (const [memberKey, member] of Object.entries(def.members)) {
    const wire = member.wire;
    wires.push(wire);
    const pyVal = typeof wire === 'number' ? wire : pyQuote(wire);
    pyLines.push(`    ${memberKey} = ${pyVal}`);
  }
  pyLines.push('');

  const sectionTitle = enumName
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/paymentstatus|paymentmethod/, m => m)
    .split(/(?=[A-Z])/)
    .join('-')
    .toLowerCase();

  tsParts.push(`// =============================================================================`);
  tsParts.push(`// ${sectionTitle}`);
  tsParts.push(`// =============================================================================`);

  const wireLiteral = wires.map(w => (typeof w === 'number' ? w : JSON.stringify(w))).join(',');
  tsParts.push(`export const ${prefix}_VALUES = [${wireLiteral}] as const;`);
  tsParts.push('');
  tsParts.push(`export type ${enumName} = (typeof ${prefix}_VALUES)[number];`);
  tsParts.push('');

  const configShape = buildConfigTypeLiteral(def.members);
  tsParts.push(`export const ${prefix}_CONFIG: Record<${enumName}, ${configShape}> = {`);

  const configEntries = [];
  for (const [, member] of Object.entries(def.members)) {
    const wire = member.wire;
    const wireKey = typeof wire === 'number' ? wire : JSON.stringify(wire);
    const props = { ...member };
    delete props.wire;
    const propsJson = Object.entries(props)
      .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
      .join(', ');
    configEntries.push(`  ${wireKey}: { ${propsJson} }`);
  }
  tsParts.push(configEntries.join(',\n'));
  tsParts.push(`};`);
  tsParts.push('');
  tsParts.push(`export const ${prefix}_OPTIONS = ${prefix}_VALUES.map(value => ({`);
  tsParts.push(`  value,`);
  tsParts.push(`  label: ${prefix}_CONFIG[value].label,`);
  tsParts.push(`}));`);
  tsParts.push('');

  if (def.filterAllLabel) {
    tsParts.push(`export const ${prefix}_FILTER_OPTIONS = [`);
    tsParts.push(`  { value: 'all' as const, label: ${JSON.stringify(def.filterAllLabel)} },`);
    tsParts.push(`  ...${prefix}_OPTIONS,`);
    tsParts.push(`];`);
    tsParts.push('');
  }

  if (enumName === 'OrderStatus') {
    tsParts.push(`export const ORDER_STATUS_TIMELINE = ${prefix}_VALUES.map(status => ({`);
    tsParts.push(`  status,`);
    tsParts.push(`  label: ${prefix}_CONFIG[status].label,`);
    tsParts.push(`}));`);
    tsParts.push('');
  }

  if (enumName === 'PresentationPrimary') {
    tsParts.push(`export const PRESENTATION_BADGE_VARIANTS = Object.fromEntries(`);
    tsParts.push(`  ${prefix}_VALUES.map(value => [value, ${prefix}_CONFIG[value].badgeVariant])`);
    tsParts.push(`) as Record<${enumName}, string>;`);
    tsParts.push('');
    tsParts.push(`export const PRESENTATION_DISPLAY_LABELS = Object.fromEntries(`);
    tsParts.push(`  ${prefix}_VALUES.map(value => [value, ${prefix}_CONFIG[value].label])`);
    tsParts.push(`) as Record<${enumName}, string>;`);
    tsParts.push('');
    tsParts.push(`export type CanonicalPresentationPrimary = ${enumName};`);
    tsParts.push(`export const CANONICAL_PRIMARY_VALUES = ${prefix}_VALUES;`);
    tsParts.push('');

    const badge = {};
    const display = {};
    const wiresPy = [];
    for (const [, member] of Object.entries(def.members)) {
      const wire = member.wire;
      wiresPy.push(typeof wire === 'number' ? wire : pyQuote(wire));
      if (typeof wire === 'string') {
        if (member.badgeVariant) badge[wire] = member.badgeVariant;
        if (member.label) display[wire] = member.label;
      }
    }
    pyLines.push(`PRESENTATION_PRIMARY_VALUES: tuple[str, ...] = (${wiresPy.join(', ')})`);
    pyLines.push('');
    pyLines.push('PRESENTATION_PRIMARY_BADGE_VARIANTS: dict[str, str] = {');
    for (const [k, v] of Object.entries(badge)) {
      pyLines.push(`    ${pyQuote(k)}: ${pyQuote(v)},`);
    }
    pyLines.push('}');
    pyLines.push('');
    pyLines.push('PRESENTATION_PRIMARY_DISPLAY_LABELS: dict[str, str] = {');
    for (const [k, v] of Object.entries(display)) {
      pyLines.push(`    ${pyQuote(k)}: ${pyQuote(v)},`);
    }
    pyLines.push('}');
    pyLines.push('');
  }

  if (enumName === 'UserRole') {
    tsParts.push(`export const ALL_ROLES = [...${prefix}_VALUES] as ${enumName}[];`);
    tsParts.push('');
  }
}

if (containers?.entries) {
  const order = containers.order || Object.keys(containers.entries);
  tsParts.push(`// =============================================================================`);
  tsParts.push(`// container-catalog`);
  tsParts.push(`// =============================================================================`);
  tsParts.push(`export const CONTAINER_CATALOG_VALUES = ${JSON.stringify(order)} as const;`);
  tsParts.push('');
  tsParts.push(`export type ContainerCatalogId = (typeof CONTAINER_CATALOG_VALUES)[number];`);
  tsParts.push('');
  tsParts.push(`export const CONTAINER_CATALOG_CONFIG: Record<`);
  tsParts.push(`  ContainerCatalogId,`);
  tsParts.push(`  { label: string; additive?: string; commonUses: string; textClass?: string }`);
  tsParts.push(`> = {`);
  for (const id of order) {
    const e = containers.entries[id];
    if (!e) continue;
    const fields = Object.entries(e)
      .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
      .join(', ');
    tsParts.push(`  ${JSON.stringify(id)}: { ${fields} },`);
  }
  tsParts.push(`};`);
  tsParts.push('');
  tsParts.push(`export const CONTAINER_CATALOG_OPTIONS = CONTAINER_CATALOG_VALUES.map(value => ({`);
  tsParts.push(`  value,`);
  tsParts.push(`  label: CONTAINER_CATALOG_CONFIG[value].label,`);
  tsParts.push(`}));`);
  tsParts.push('');
  if (containers.filterAllLabel) {
    tsParts.push(`export const CONTAINER_CATALOG_FILTER_OPTIONS = [`);
    tsParts.push(`  { value: 'all' as const, label: ${JSON.stringify(containers.filterAllLabel)} },`);
    tsParts.push(`  ...CONTAINER_CATALOG_OPTIONS,`);
    tsParts.push(`];`);
    tsParts.push('');
  }
  if (containers.collectionTopColorPresets) {
    tsParts.push(
      `export const COLLECTION_TOP_COLOR_PRESETS = ${JSON.stringify(containers.collectionTopColorPresets)} as const;`,
    );
    tsParts.push('');
  }
  if (containers.frontendToBackendColor) {
    tsParts.push(
      `export const FRONTEND_TO_BACKEND_COLOR: Record<string, ContainerTopColor> = ${JSON.stringify(containers.frontendToBackendColor, null, 2)} as Record<string, ContainerTopColor>;`,
    );
    tsParts.push('');
  }
}

fs.writeFileSync(pyOut, `${pyLines.join('\n')}\n`);
fs.writeFileSync(tsOut, `${tsParts.join('\n')}\n`);
console.log(`Wrote ${tsOut}`);
console.log(`Wrote ${pyOut}`);

const typecheck = spawnSync('npm', ['run', 'typecheck'], {
  cwd: path.join(root, 'frontend'),
  stdio: 'inherit',
  shell: false,
});
if (typecheck.status !== 0) {
  console.error('generate-enums: typecheck failed after writing enums.ts');
  process.exit(typecheck.status ?? 1);
}
console.log('generate-enums: typecheck OK');