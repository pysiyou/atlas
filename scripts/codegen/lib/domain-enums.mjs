/**
 * Domain enums — contracts/enums.json → enums.py + frontend/types/enums/generated/*.ts
 * ENUM_MODULE_MAP: stable TS file layout (not in JSON).
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  assertMembersShape,
  enumWireValues,
  iterEnumMembers,
  presentationFields,
  wireLookupKey,
} from './enum-contract.mjs';
import { CONTRACTS, loadDomainEnums, writeFile } from './read-contract.mjs';

const ENUM_MODULE_MAP = {
  gender: ['Gender'],
  affiliation: ['AffiliationDuration'],
  relationship: ['Relationship'],
  user: ['UserRole'],
  order: ['OrderStatus', 'PaymentStatus', 'PriorityLevel', 'PaymentMethod'],
  sample: ['SampleStatus', 'SampleType'],
  test: ['TestStatus'],
  result: ['ResultStatus'],
  validation: ['ValidationDecision'],
  rejection: ['RejectionReason'],
  'container-enums': ['ContainerType', 'ContainerTopColor'],
  'lab-quality': [
    'QualityStage',
    'QualityDomain',
    'RemedyType',
    'RecollectionRequestStatus',
    'QualityIssueTargetType',
    'EscalationReasonCode',
    'EscalationTicketStatus',
    'EscalationSeverity',
    'EscalationResolutionAction',
  ],
  billing: ['ClaimStatus'],
  presentation: ['PresentationPrimary'],
};

function enumConstPrefix(enumName) {
  if (enumName === 'AffiliationDuration') return 'AFFILIATION_DURATION';
  return enumName.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
}

function validateDomainEnums(enums) {
  for (const [name, def] of Object.entries(enums)) {
    assertMembersShape(def, name);
    const wires = new Set();
    const wireSetForSample = new Set(enumWireValues(def));

    for (const [constName, member] of iterEnumMembers(def)) {
      if (member.wire === undefined) {
        console.error(`enums.json: ${name}.members.${constName} missing wire`);
        process.exit(1);
      }
      if (typeof member.label !== 'string' || member.label.length === 0) {
        console.error(`enums.json: ${name}.members.${constName} missing label`);
        process.exit(1);
      }
      const wKey = wireLookupKey(member.wire);
      if (wires.has(wKey)) {
        console.error(`enums.json: ${name} duplicate wire ${wKey}`);
        process.exit(1);
      }
      wires.add(wKey);

      if (
        name === 'SampleType' &&
        member.collectionSource !== undefined &&
        !wireSetForSample.has(member.collectionSource)
      ) {
        console.error(
          `enums.json: SampleType.members.${constName} collectionSource must match a member wire`,
        );
        process.exit(1);
      }
    }
  }
}

function configFieldType(entries, enumName) {
  const merged = {};
  for (const entry of entries) {
    merged.label = true;
    if (entry.description !== undefined) merged.description = true;
    if (entry.icon !== undefined) merged.icon = true;
    if (entry.turnaroundHours !== undefined) merged.turnaroundHours = true;
    if (entry.isDerived !== undefined) merged.isDerived = true;
    if (entry.collectionSource !== undefined) merged.collectionSource = true;
    if (entry.enabled !== undefined) merged.enabled = true;
    if (entry.iconKey !== undefined) merged.iconKey = true;
    if (entry.badgeVariant !== undefined) merged.badgeVariant = true;
  }
  const parts = ['label: string'];
  if (merged.description) parts.push('description: string');
  if (merged.icon) parts.push('icon?: string');
  if (merged.turnaroundHours) parts.push('turnaroundHours: number');
  if (merged.isDerived) parts.push('isDerived: boolean');
  if (merged.collectionSource) {
    parts.push(`collectionSource?: ${enumName === 'SampleType' ? 'SampleType' : 'string'}`);
  }
  if (merged.enabled) parts.push('enabled: boolean');
  if (merged.iconKey) parts.push('iconKey: string');
  if (merged.badgeVariant) parts.push('badgeVariant: string');
  return `{ ${parts.join('; ')} }`;
}

function configObjectLiteral(entry) {
  const fields = [`label: ${JSON.stringify(entry.label)}`];
  if (entry.description !== undefined) fields.push(`description: ${JSON.stringify(entry.description)}`);
  if (entry.icon !== undefined) fields.push(`icon: ${JSON.stringify(entry.icon)}`);
  if (entry.turnaroundHours !== undefined) fields.push(`turnaroundHours: ${entry.turnaroundHours}`);
  if (entry.isDerived !== undefined) fields.push(`isDerived: ${entry.isDerived}`);
  if (entry.collectionSource !== undefined) {
    fields.push(`collectionSource: ${JSON.stringify(entry.collectionSource)}`);
  }
  if (entry.enabled !== undefined) fields.push(`enabled: ${entry.enabled}`);
  if (entry.iconKey !== undefined) fields.push(`iconKey: ${JSON.stringify(entry.iconKey)}`);
  if (entry.badgeVariant !== undefined) fields.push(`badgeVariant: ${JSON.stringify(entry.badgeVariant)}`);
  return `{ ${fields.join(', ')} }`;
}

function generateEnumBlock(enumName, def) {
  const values = enumWireValues(def);
  const prefix = enumConstPrefix(enumName);
  const valuesName = `${prefix}_VALUES`;
  const configName = `${prefix}_CONFIG`;
  const optionsName = `${prefix}_OPTIONS`;
  const typeName = enumName;

  const valuesLiteral = values.map(v => (typeof v === 'string' ? JSON.stringify(v) : v)).join(', ');

  const configEntries = iterEnumMembers(def)
    .map(([, member]) => {
      const entry = presentationFields(member);
      const keyLit = typeof member.wire === 'string' ? JSON.stringify(member.wire) : member.wire;
      return `  ${keyLit}: ${configObjectLiteral(entry)}`;
    })
    .join(',\n');

  const entryList = iterEnumMembers(def).map(([, member]) => presentationFields(member));
  const configType = `Record<${typeName}, ${configFieldType(entryList, enumName)}>`;

  let extra = '';

  if (def.filterAllLabel && enumName !== 'PaymentMethod') {
    extra += `
export const ${prefix}_FILTER_OPTIONS = [
  { value: 'all' as const, label: ${JSON.stringify(def.filterAllLabel)} },
  ...${optionsName},
];
`;
  }

  if (enumName === 'PresentationPrimary') {
    extra += `
export const PRESENTATION_BADGE_VARIANTS = Object.fromEntries(
  PRESENTATION_PRIMARY_VALUES.map(value => [value, PRESENTATION_PRIMARY_CONFIG[value].badgeVariant])
) as Record<PresentationPrimary, string>;

export const PRESENTATION_DISPLAY_LABELS = Object.fromEntries(
  PRESENTATION_PRIMARY_VALUES.map(value => [value, PRESENTATION_PRIMARY_CONFIG[value].label])
) as Record<PresentationPrimary, string>;

export type CanonicalPresentationPrimary = PresentationPrimary;
export const CANONICAL_PRIMARY_VALUES = PRESENTATION_PRIMARY_VALUES;
`;
  }

  if (enumName === 'OrderStatus') {
    extra += `
export const ORDER_STATUS_TIMELINE = ORDER_STATUS_VALUES.map(status => ({
  status,
  label: ORDER_STATUS_CONFIG[status].label,
}));
`;
  }

  if (enumName === 'UserRole') {
    extra += `
export const ALL_ROLES = [...USER_ROLE_VALUES] as UserRole[];
`;
  }

  if (enumName === 'SampleType') {
    extra += `
export const BASE_SAMPLE_TYPES = SAMPLE_TYPE_VALUES.filter(
  type => !SAMPLE_TYPE_CONFIG[type].isDerived
);

export const DERIVED_SAMPLE_TYPES = SAMPLE_TYPE_VALUES.filter(
  type => SAMPLE_TYPE_CONFIG[type].isDerived
);
`;
  }

  const optionsBlock =
    enumName === 'PaymentMethod'
      ? ''
      : `
export const ${optionsName} = ${valuesName}.map(value => ({
  value,
  label: ${configName}[value].label,
}));
`;

  return `export const ${valuesName} = [${valuesLiteral}] as const;

export type ${typeName} = (typeof ${valuesName})[number];

export const ${configName}: ${configType} = {
${configEntries},
};
${optionsBlock}${extra}`;
}

function generateFrontendEnums(enums) {
  validateDomainEnums(enums);

  for (const [fileStem, enumNames] of Object.entries(ENUM_MODULE_MAP)) {
    const blocks = enumNames.map(name => {
      const def = enums[name];
      if (!def) {
        console.error(`enums.json missing ${name} for module ${fileStem}`);
        process.exit(1);
      }
      return generateEnumBlock(name, def);
    });

    const ts = `/** GENERATED from contracts/enums.json. DO NOT EDIT. */
${blocks.join('\n')}
`;
    writeFile(`frontend/src/types/enums/generated/${fileStem}.ts`, ts);
  }
}

export function generateEnums() {
  const jsonPath = path.join(CONTRACTS, 'enums.json');
  if (!fs.existsSync(jsonPath)) {
    console.log('skip enums (contracts/enums.json not found)');
    return;
  }
  const enums = loadDomainEnums();
  const blocks = Object.entries(enums).map(([name, def]) => {
    assertMembersShape(def, name);
    const base = def.type === 'int' ? 'int, enum.Enum' : 'str, enum.Enum';
    const entries = iterEnumMembers(def)
      .map(([k, member]) => {
        const v = member.wire;
        return `    ${k} = ${typeof v === 'string' ? JSON.stringify(v) : v}`;
      })
      .join('\n');
    return `class ${name}(${base}):\n${entries}`;
  });
  const py = `"""
Enum types — GENERATED from contracts/enums.json. DO NOT EDIT.
"""
import enum


${blocks.join('\n\n')}
`;
  const pyFull = py + (enums.PresentationPrimary ? presentationPyExtra(enums.PresentationPrimary) : '');
  writeFile('backend/app/shared/contracts/enums.py', pyFull);
  generateFrontendEnums(enums);
}

function presentationPyExtra(presentation) {
  const badgeLines = iterEnumMembers(presentation)
    .map(([, m]) => `    ${JSON.stringify(m.wire)}: ${JSON.stringify(m.badgeVariant ?? 'neutral')},`)
    .join('\n');
  const labelLines = iterEnumMembers(presentation)
    .map(([, m]) => `    ${JSON.stringify(m.wire)}: ${JSON.stringify(m.label)},`)
    .join('\n');
  const valueLines = enumWireValues(presentation)
    .map(v => `    ${JSON.stringify(v)},`)
    .join('\n');
  return `

PRESENTATION_PRIMARY_VALUES: tuple[str, ...] = (
${valueLines}
)

PRESENTATION_PRIMARY_BADGE_VARIANTS: dict[str, str] = {
${badgeLines}
}

PRESENTATION_PRIMARY_DISPLAY_LABELS: dict[str, str] = {
${labelLines}
}
`;
}
