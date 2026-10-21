/**
 * Panel preset registry — layout-intent ids only.
 */

import { layoutPanelPresets } from './layoutPresets';
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
export { layoutPanelPresets } from './layoutPresets';

export const PANEL_PRESETS = layoutPanelPresets;

export type PanelPresetId = keyof typeof layoutPanelPresets;

export function getPanelPreset(preset: PanelPresetId): PanelPresetDefinition {
  return layoutPanelPresets[preset];
}
