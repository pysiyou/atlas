/**
 * Panel preset types — chrome is owned by the registry, not by call sites.
 */

export type PanelVariant = 'page' | 'pageEmbed' | 'lab' | 'labEmbed';
export type PanelScroll = 'default' | 'auto' | 'visible';
export type PanelSpacing = 'none' | 'compact' | 'normal' | 'relaxed';

export type PanelShellLayout =
  | 'default'
  | 'detailShrink'
  | 'detailFill'
  | 'detailMinH'
  | 'gridSpan2'
  | 'gridSpan2Min'
  | 'gridSpan2Fill'
  | 'stackMinHeight'
  | 'fullWidth'
  | 'modalShrink';

export type PanelBodyLayout =
  | 'default'
  | 'formStack'
  | 'flexColumn'
  | 'flexColumnMin'
  | 'flexColumnFill'
  | 'embedFlexFill'
  | 'minH0';

export interface PanelPresetDefinition {
  /** Static header copy. Empty when `headingSlot` or `hideHeader` is set. */
  title: string;
  variant: PanelVariant;
  scroll?: PanelScroll;
  spacing?: PanelSpacing;
  hideHeader?: boolean;
  /** Header start slot supplies the heading (e.g. per-test report preview). */
  headingSlot?: boolean;
  /** Static helper line. Call-site `meta` overrides this. */
  meta?: string;
  shellLayout?: PanelShellLayout;
  bodyLayout?: PanelBodyLayout;
  maxHeightClass?: string;
}
