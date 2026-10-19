/**
 * Panel preset registry — titles and chrome live here, not at JSX call sites.
 */

import { auditPanelPresets, catalogPanelPresets, dashboardPanelPresets, paymentPanelPresets, reportPanelPresets } from './shared';
import { labPanelPresets } from './lab';
import { orderPanelPresets } from './orders';
import { patientPanelPresets } from './patient';
import type { PanelPresetDefinition } from './types';

export type {
  PanelBodyLayout,
  PanelPresetDefinition,
  PanelScroll,
  PanelShellLayout,
  PanelSpacing,
  PanelVariant,
} from './types';

export { PANEL_BODY_LAYOUT, PANEL_SCROLL, PANEL_SHELL_LAYOUT, PANEL_SPACING } from './layouts';

export const PANEL_PRESETS = {
  ...patientPanelPresets,
  ...orderPanelPresets,
  ...labPanelPresets,
  ...dashboardPanelPresets,
  ...auditPanelPresets,
  ...paymentPanelPresets,
  ...catalogPanelPresets,
  ...reportPanelPresets,
} as const satisfies Record<string, PanelPresetDefinition>;

export type PanelPresetId = keyof typeof PANEL_PRESETS;

export function getPanelPreset(preset: PanelPresetId): PanelPresetDefinition {
  return PANEL_PRESETS[preset];
}
