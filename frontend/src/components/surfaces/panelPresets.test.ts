import { describe, expect, it } from 'vitest';
import { getPanelPreset, PANEL_PRESETS, type PanelPresetId } from './panelPresets';

describe('PANEL_PRESETS', () => {
  const ids = Object.keys(PANEL_PRESETS) as PanelPresetId[];

  it('registers unique namespaced ids', () => {
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every(id => id.includes('.'))).toBe(true);
  });

  it('resolves every preset with title, heading slot, or hidden header', () => {
    for (const id of ids) {
      const preset = getPanelPreset(id);
      const hasHeading = preset.title.trim().length > 0 || preset.hideHeader || preset.headingSlot;
      expect(hasHeading, id).toBe(true);
      expect(preset.variant).toMatch(/^(page|pageEmbed|lab|labEmbed)$/);
    }
  });
});
