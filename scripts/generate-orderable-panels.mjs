#!/usr/bin/env node
/**
 * Generate panel registry modules from contracts/catalog/orderable-panels.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const panelsPath = path.join(root, 'contracts', 'catalog', 'orderable-panels.json');
const pyOut = path.join(root, 'backend', 'app', 'shared', 'contracts', 'orderable_panels.py');
const tsOut = path.join(root, 'frontend', 'src', 'types', 'generated', 'orderablePanels.ts');

const data = JSON.parse(fs.readFileSync(panelsPath, 'utf-8'));
const panels = data.panels;
if (!Array.isArray(panels) || panels.length === 0) {
  console.error('orderable-panels.json must have a non-empty "panels" array');
  process.exit(1);
}

const ids = new Set();
for (const panel of panels) {
  if (!panel.id || !panel.name) {
    console.error('Each panel requires id and name');
    process.exit(1);
  }
  if (ids.has(panel.id)) {
    console.error(`Duplicate panel id: ${panel.id}`);
    process.exit(1);
  }
  ids.add(panel.id);
}

function pyStr(value) {
  return JSON.stringify(value);
}

const pyEntries = panels
  .map(
    p =>
      `    ${pyStr(p.id)}: OrderablePanelDef(id=${pyStr(p.id)}, name=${pyStr(p.name)}, description=${pyStr(p.description ?? '')}),`
  )
  .join('\n');

const pyIds = panels.map(p => pyStr(p.id)).join(', ');

const py = `"""
Orderable panel registry — GENERATED from contracts/catalog/orderable-panels.json. DO NOT EDIT.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class OrderablePanelDef:
    id: str
    name: str
    description: str


ORDERABLE_PANEL_BY_ID: dict[str, OrderablePanelDef] = {
${pyEntries}
}

ORDERABLE_PANEL_IDS: frozenset[str] = frozenset((${pyIds}))


def is_orderable_panel_id(value: str) -> bool:
    return value in ORDERABLE_PANEL_BY_ID


def resolve_orderable_panel_label(panel_id: str) -> str:
    entry = ORDERABLE_PANEL_BY_ID.get(panel_id)
    return entry.name if entry else panel_id
`;

fs.writeFileSync(pyOut, py);

const tsEntries = panels
  .map(
    p =>
      `  ${JSON.stringify(p.id)}: { id: ${JSON.stringify(p.id)}, name: ${JSON.stringify(p.name)}, description: ${JSON.stringify(p.description ?? '')} },`
  )
  .join('\n');

const tsIds = panels.map(p => JSON.stringify(p.id)).join(' | ');

const ts = `/** GENERATED — DO NOT EDIT. Regenerate: npm run codegen:panels */
export type OrderablePanelId = ${tsIds};

export interface OrderablePanelDef {
  id: OrderablePanelId;
  name: string;
  description: string;
}

export const ORDERABLE_PANEL_BY_ID: Record<OrderablePanelId, OrderablePanelDef> = {
${tsEntries}
};

export function isOrderablePanelId(value: string): value is OrderablePanelId {
  return Object.prototype.hasOwnProperty.call(ORDERABLE_PANEL_BY_ID, value);
}

export function resolveOrderablePanelLabel(panelId: string): string {
  const entry = ORDERABLE_PANEL_BY_ID[panelId as OrderablePanelId];
  return entry?.name ?? panelId;
}
`;

fs.writeFileSync(tsOut, ts);
console.log(`Wrote ${pyOut}`);
console.log(`Wrote ${tsOut}`);