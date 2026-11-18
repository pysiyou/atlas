#!/usr/bin/env node
/**
 * Generate enums.ts / enums.py from contracts/enums.json (including containers).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const enumsPath = path.join(root, 'contracts', 'enums.json');
const tsOut = path.join(root, 'frontend', 'src', 'types', 'generated', 'enums.ts');
const pyOut = path.join(root, 'backend', 'app', 'shared', 'contracts', 'enums.py');

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

  tsParts.push(`// =============================================================================`);
  tsParts.push(`// ${enumName.toLowerCase().replace(/([a-z])([A-Z])/g, '$1-$2')}`);
  tsParts.push(`// =============================================================================`);

  const wireLiteral = wires.map(w => (typeof w === 'number' ? w : JSON.stringify(w))).join(',');
  tsParts.push(`export const ${prefix}_VALUES = [${wireLiteral}] as const;`);
  tsParts.push('');
  tsParts.push(`export type ${enumName} = (typeof ${prefix}_VALUES)[number];`);
  tsParts.push('');
  tsParts.push(`export const ${prefix}_CONFIG: Record<${enumName}, Record<string, unknown>> = {`);

  const configEntries = [];
  for (const [memberKey, member] of Object.entries(def.members)) {
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
  tsParts.push(
    `export const ${prefix}_OPTIONS = ${prefix}_VALUES.map(value => ({`,
  );
  tsParts.push(`  value,`);
  tsParts.push(`  label: String((${prefix}_CONFIG as Record<string, { label?: string }>)[value]?.label ?? value),`);
  tsParts.push(`}));`);
  tsParts.push('');

  if (def.filterAllLabel) {
    tsParts.push(`export const ${prefix}_FILTER_ALL_LABEL = ${JSON.stringify(def.filterAllLabel)};`);
    tsParts.push('');
  }

  if (enumName === 'PresentationPrimary') {
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
}

if (containers?.entries) {
  const order = containers.order || Object.keys(containers.entries);
  tsParts.push(`// =============================================================================`);
  tsParts.push(`// containers`);
  tsParts.push(`// =============================================================================`);
  tsParts.push(
    `export const CONTAINER_CATALOG_VALUES = ${JSON.stringify(order)} as const;`,
  );
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
  tsParts.push(
    `export const CONTAINER_CATALOG_OPTIONS = CONTAINER_CATALOG_VALUES.map(value => ({`,
  );
  tsParts.push(`  value,`);
  tsParts.push(`  label: CONTAINER_CATALOG_CONFIG[value].label,`);
  tsParts.push(`}));`);
  tsParts.push('');
  if (containers.filterAllLabel) {
    tsParts.push(
      `export const CONTAINER_CATALOG_FILTER_ALL_LABEL = ${JSON.stringify(containers.filterAllLabel)};`,
    );
    tsParts.push('');
  }
  if (containers.collectionTopColorPresets) {
    tsParts.push(
      `export const COLLECTION_TOP_COLOR_PRESETS = ${JSON.stringify(containers.collectionTopColorPresets)} as const;`,
    );
    tsParts.push('');
  }
  if (containers.frontendToBackendColor) {
    tsParts.push(`export const FRONTEND_TO_BACKEND_COLOR: Record<string, string> = ${JSON.stringify(containers.frontendToBackendColor, null, 2)};`);
    tsParts.push('');
  }
}

fs.writeFileSync(pyOut, `${pyLines.join('\n')}\n`);
fs.writeFileSync(tsOut, `${tsParts.join('\n')}\n`);
console.log(`Wrote ${tsOut}`);
console.log(`Wrote ${pyOut}`);