/**
 * Panel layout preset registry — used by surfaces/Panel.tsx.
 */

import { layoutPanelPresets } from './panelLayoutPresets';
import type { PanelPresetDefinition } from './panelLayoutTypes';

export type {
  PanelBodyLayout,
  PanelPresetDefinition,
  PanelScroll,
  PanelShellLayout,
  PanelSpacing,
  PanelVariant,
} from './panelLayoutTypes';

export { PANEL_BODY_LAYOUT, PANEL_SCROLL, PANEL_SHELL_LAYOUT, PANEL_SPACING } from './panelLayoutTokens';
export { layoutPanelPresets } from './panelLayoutPresets';

export const PANEL_PRESETS = layoutPanelPresets;

export type PanelPresetId = keyof typeof layoutPanelPresets;

export function getPanelPreset(preset: PanelPresetId): PanelPresetDefinition {
  return layoutPanelPresets[preset];
}
