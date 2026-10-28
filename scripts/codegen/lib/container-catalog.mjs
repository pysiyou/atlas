import fs from 'node:fs';
import path from 'node:path';
import { enumWireValues } from './enum-contract.mjs';
import { CONTRACTS, loadDomainEnums, readJson, writeFile } from './read-contract.mjs';

export function generateContainerCatalog() {
  const catalogPath = path.join(CONTRACTS, 'container-catalog.json');
  if (!fs.existsSync(catalogPath)) {
    console.log('skip container catalog (contracts/container-catalog.json not found)');
    return;
  }
  const catalog = readJson('container-catalog.json');
  let wireColors = null;
  if (fs.existsSync(path.join(CONTRACTS, 'enums.json'))) {
    const enums = loadDomainEnums();
    if (enums.ContainerTopColor) {
      wireColors = new Set(enumWireValues(enums.ContainerTopColor));
    }
  }

  const { order, entries, collectionTopColorPresets, frontendToBackendColor, filterAllLabel } =
    catalog;
  if (!Array.isArray(order) || !entries || typeof entries !== 'object') {
    console.error('container-catalog.json requires order[] and entries{}');
    process.exit(1);
  }
  for (const id of order) {
    if (!entries[id]) {
      console.error(`container-catalog.json missing entries for ${id}`);
      process.exit(1);
    }
  }
  for (const id of collectionTopColorPresets ?? []) {
    if (!entries[id]) {
      console.error(`collectionTopColorPresets references unknown id ${id}`);
      process.exit(1);
    }
  }
  if (frontendToBackendColor) {
    for (const [catalogId, color] of Object.entries(frontendToBackendColor)) {
      if (!entries[catalogId]) {
        console.error(`frontendToBackendColor references unknown id ${catalogId}`);
        process.exit(1);
      }
      if (wireColors && !wireColors.has(color)) {
        console.error(
          `frontendToBackendColor ${catalogId} -> ${color} is not a ContainerTopColor wire value`
        );
        process.exit(1);
      }
    }
  }

  const configEntries = order
    .map(id => {
      const e = entries[id];
      const fields = [`label: ${JSON.stringify(e.label)}`, `commonUses: ${JSON.stringify(e.commonUses)}`];
      if (e.additive !== undefined) fields.push(`additive: ${JSON.stringify(e.additive)}`);
      if (e.textClass !== undefined) fields.push(`textClass: ${JSON.stringify(e.textClass)}`);
      return `  ${JSON.stringify(id)}: { ${fields.join(', ')} }`;
    })
    .join(',\n');

  const mapEntries = Object.entries(frontendToBackendColor ?? {})
    .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`)
    .join(',\n');

  const presetsLiteral = JSON.stringify(collectionTopColorPresets ?? []);

  const ts = `/** GENERATED from contracts/container-catalog.json. DO NOT EDIT. */
import type { ContainerTopColor } from './container-enums';

export const CONTAINER_CATALOG_VALUES = ${JSON.stringify(order)} as const;

export type ContainerCatalogId = (typeof CONTAINER_CATALOG_VALUES)[number];

export const CONTAINER_CATALOG_CONFIG: Record<
  ContainerCatalogId,
  {
    label: string;
    additive?: string;
    commonUses: string;
    textClass?: string;
  }
> = {
${configEntries},
};

export const CONTAINER_CATALOG_OPTIONS = CONTAINER_CATALOG_VALUES.map(value => ({
  value,
  label: CONTAINER_CATALOG_CONFIG[value].label,
}));

export const COLLECTION_TOP_COLOR_PRESETS = ${presetsLiteral} as ContainerCatalogId[];

export const CONTAINER_CATALOG_FILTER_OPTIONS = [
  { value: 'all' as const, label: ${JSON.stringify(filterAllLabel ?? 'All Containers')} },
  ...CONTAINER_CATALOG_OPTIONS,
];

/** Catalog preset id → API ContainerTopColor wire value for collection submit. */
export const FRONTEND_TO_BACKEND_COLOR: Record<string, ContainerTopColor> = {
${mapEntries},
};
`;
  writeFile('frontend/src/types/enums/generated/container-catalog.ts', ts);
}
