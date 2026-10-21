/** Design-token ESLint selectors (type, surface, radius, palette). Spacing is separate. */

/** Raw Tailwind scale classes — use TYPE / TABLE_TYPE / DETAIL_TYPE or type-* utilities. */
/** Raw type-* utilities in app code — define stacks in theme/recipes instead. */
export const typeUtilityRestrictedSyntax = [
  {
    selector:
      'Literal[value=/\\btype-(body|label|caption|amount|micro|page-title|table-cell|detail-value|detail-label|button-sm|button-md|button-lg|chrome-|empty-|section-title|panel-title|modal-title|badge)\\b/]',
    message:
      'Use recipe tokens from @/theme/recipes (TYPE, TABLE_TYPE, DOCUMENT_TYPE, etc.), not raw type-* utilities.',
  },
  {
    selector:
      'TemplateElement[value.raw=/\\btype-(body|label|caption|amount|micro|page-title|table-cell|detail-value|detail-label|button-sm|button-md|button-lg|chrome-|empty-|section-title|panel-title|modal-title|badge)\\b/]',
    message:
      'Use recipe tokens from @/theme/recipes (TYPE, TABLE_TYPE, DOCUMENT_TYPE, etc.), not raw type-* utilities.',
  },
]

export const typeScaleRestrictedSyntax = [
  {
    selector: 'Literal[value=/\\btext-(3xs|2xs|xxs|xs|sm|base|lg|xl|2xl)\\b/]',
    message:
      'Use semantic typography from @/theme/recipes (TYPE, TABLE_TYPE, DETAIL_TYPE, FIELD_ERROR), not raw text-* scale classes.',
  },
  {
    selector: 'TemplateElement[value.raw=/\\btext-(3xs|2xs|xxs|xs|sm|base|lg|xl|2xl)\\b/]',
    message:
      'Use semantic typography from @/theme/recipes (TYPE, TABLE_TYPE, DETAIL_TYPE, FIELD_ERROR), not raw text-* scale classes.',
  },
  {
    selector: 'Literal[value=/text-text-primary truncate font-normal/]',
    message:
      'Use TABLE_TYPE.cell or TABLE_PRIMARY_CELL_CLASS from @/utils/tableColumnRenders for table body text.',
  },
  {
    selector: 'TemplateElement[value.raw=/text-text-primary truncate font-normal/]',
    message:
      'Use TABLE_TYPE.cell or TABLE_PRIMARY_CELL_CLASS from @/utils/tableColumnRenders for table body text.',
  },
]

export const designTokenRestrictedSyntax = [
  {
    selector: 'Literal[value=/text-\\[\\d+px\\]/]',
    message: 'Use type-* utilities or recipes TYPE/TABLE_TYPE, not arbitrary px font sizes.',
  },
  {
    selector: 'TemplateElement[value.raw=/text-\\[\\d+px\\]/]',
    message: 'Use type-* utilities or recipes TYPE/TABLE_TYPE, not arbitrary px font sizes.',
  },
  ...typeScaleRestrictedSyntax,
  {
    selector: 'Literal[value=/text-xs text-text-secondary/]',
    message: 'Use TYPE.label from @/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/text-xs text-text-secondary/]',
    message: 'Use TYPE.label from @/theme/recipes.',
  },
  {
    selector: 'Literal[value=/text-xs text-text-primary/]',
    message: 'Use TYPE.value from @/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/text-xs text-text-primary/]',
    message: 'Use TYPE.value from @/theme/recipes.',
  },
  {
    selector: 'Literal[value=/text-xs text-text-tertiary/]',
    message: 'Use TYPE.meta from @/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/text-xs text-text-tertiary/]',
    message: 'Use TYPE.meta from @/theme/recipes.',
  },
  {
    selector: 'Literal[value=/text-xxs text-text-tertiary/]',
    message: 'Use TYPE.caption from @/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/text-xxs text-text-tertiary/]',
    message: 'Use TYPE.caption from @/theme/recipes.',
  },
  {
    selector: 'Literal[value=/text-sm font-medium text-text-primary/]',
    message: 'Use TYPE.detailTitle from @/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/text-sm font-medium text-text-primary/]',
    message: 'Use TYPE.detailTitle from @/theme/recipes.',
  },
  {
    selector: 'Literal[value=/text-sm text-text-primary/]',
    message: 'Use TYPE.amount from @/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/text-sm text-text-primary/]',
    message: 'Use TYPE.amount from @/theme/recipes.',
  },
  {
    selector: 'Literal[value=/bg-surface border border-border-default/]',
    message: 'Use SURFACE.raised from @/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/bg-surface border border-border-default/]',
    message: 'Use SURFACE.raised from @/theme/recipes.',
  },
  {
    selector: 'Literal[value=/bg-surface-page border border-border-default/]',
    message: 'Use SURFACE.recessed from @/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/bg-surface-page border border-border-default/]',
    message: 'Use SURFACE.recessed from @/theme/recipes.',
  },
  {
    selector: 'Literal[value=/bg-danger-bg border border-danger-stroke/]',
    message: 'Use TONE.danger.well or SURFACE.dangerWell from @/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/bg-danger-bg border border-danger-stroke/]',
    message: 'Use TONE.danger.well or SURFACE.dangerWell from @/theme/recipes.',
  },
  {
    selector: 'Literal[value=/(bg|text|border)-tone-/]',
    message: 'Use TONE from @/theme/recipes, not tone-* CSS classes.',
  },
  {
    selector: 'TemplateElement[value.raw=/(bg|text|border)-tone-/]',
    message: 'Use TONE from @/theme/recipes, not tone-* CSS classes.',
  },
  {
    selector: 'Literal[value=/rounded-\\[/]',
    message: 'Use RADIUS from @/theme/recipes, not arbitrary rounded-[Npx].',
  },
  {
    selector: 'TemplateElement[value.raw=/rounded-\\[/]',
    message: 'Use RADIUS from @/theme/recipes, not arbitrary rounded-[Npx].',
  },
  {
    selector: 'Literal[value=/h-\\[34px\\]/]',
    message: 'Use CONTROL.height from @/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/h-\\[34px\\]/]',
    message: 'Use CONTROL.height from @/theme/recipes.',
  },
  {
    selector: 'Literal[value=/focus:outline-none focus:ring-1 focus:ring-brand focus:ring-opacity-20 focus:border-brand/]',
    message: 'Use CONTROL.focus from @/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/focus:outline-none focus:ring-1 focus:ring-brand focus:ring-opacity-20 focus:border-brand/]',
    message: 'Use CONTROL.focus from @/theme/recipes.',
  },
  {
    selector: 'Literal[value=/focus-within:outline-none focus-within:border-brand focus-within:ring-1 focus-within:ring-brand focus-within:ring-opacity-20/]',
    message: 'Use CONTROL.focusWithin from @/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/focus-within:outline-none focus-within:border-brand focus-within:ring-1 focus-within:ring-brand focus-within:ring-opacity-20/]',
    message: 'Use CONTROL.focusWithin from @/theme/recipes.',
  },
  {
    selector: 'Literal[value=/border-border-error focus:border-border-error focus:ring-danger focus:ring-opacity-20/]',
    message: 'Use CONTROL.error from @/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/border-border-error focus:border-border-error focus:ring-danger focus:ring-opacity-20/]',
    message: 'Use CONTROL.error from @/theme/recipes.',
  },
  {
    selector: 'Literal[value=/border-border-error focus-within:border-border-error focus-within:ring-danger focus-within:ring-opacity-20/]',
    message: 'Use CONTROL.errorWithin from @/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/border-border-error focus-within:border-border-error focus-within:ring-danger focus-within:ring-opacity-20/]',
    message: 'Use CONTROL.errorWithin from @/theme/recipes.',
  },
  {
    selector: 'Literal[value=/\\brounded-full\\b/]',
    message: 'Use RADIUS.pill from @/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/\\brounded-full\\b/]',
    message: 'Use RADIUS.pill from @/theme/recipes.',
  },
  {
    selector: 'Literal[value=/\\brounded-sm\\b/]',
    message: 'Use RADIUS.field from @/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/\\brounded-sm\\b/]',
    message: 'Use RADIUS.field from @/theme/recipes.',
  },
  {
    selector: 'Literal[value=/\\brounded-xs\\b/]',
    message: 'Use RADIUS.pill or RADIUS.field from @/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/\\brounded-xs\\b/]',
    message: 'Use RADIUS.pill or RADIUS.field from @/theme/recipes.',
  },
  {
    selector: 'Literal[value=/(\s|^)rounded(\s|$)/]',
    message: 'Use RADIUS.* token utilities (e.g. RADIUS.field), not bare Tailwind rounded.',
  },
  {
    selector: 'TemplateElement[value.raw=/(\s|^)rounded(\s|$)/]',
    message: 'Use RADIUS.* token utilities (e.g. RADIUS.field), not bare Tailwind rounded.',
  },
  {
    selector: 'Literal[value=/\\brounded-(field|pill|surface|menu|menu-item|workspace|notice|button|b-surface|inset|inline)\\b/]',
    message: 'Use RADIUS from @/theme/recipes, not inline token class names.',
  },
  {
    selector: 'TemplateElement[value.raw=/\\brounded-(field|pill|surface|menu|menu-item|workspace|notice|button|b-surface|inset|inline)\\b/]',
    message: 'Use RADIUS from @/theme/recipes, not inline token class names.',
  },
  {
    selector: 'Literal[value=/\\brounded-md\\b/]',
    message: 'Use RADIUS.surface from @/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/\\brounded-md\\b/]',
    message: 'Use RADIUS.surface from @/theme/recipes.',
  },
  {
    selector: 'Literal[value=/\\brounded-lg\\b/]',
    message: 'Use RADIUS.menu from @/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/\\brounded-lg\\b/]',
    message: 'Use RADIUS.menu from @/theme/recipes.',
  },
  {
    selector: 'Literal[value=/\\brounded-xl\\b/]',
    message: 'Use RADIUS.menu from @/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/\\brounded-xl\\b/]',
    message: 'Use RADIUS.menu from @/theme/recipes.',
  },
  {
    selector:
      'Literal[value=/text-(gray|slate|red|blue|green|yellow|orange|amber|sky|purple|pink|teal|indigo|cyan)-(50|100|200|300|400|500|600|700|800|900|950)/]',
    message: 'Use semantic tokens or TONE/Badge colors, not default Tailwind palette classes.',
  },
  {
    selector:
      'TemplateElement[value.raw=/text-(gray|slate|red|blue|green|yellow|orange|amber|sky|purple|pink|teal|indigo|cyan)-(50|100|200|300|400|500|600|700|800|900|950)/]',
    message: 'Use semantic tokens or TONE/Badge colors, not default Tailwind palette classes.',
  },
]

const SPACING_SCALE = '(0\\.5|1|1\\.5|2|2\\.5|3|3\\.5|4|5|6|8|10|12)'
const INSET_SCALE = '(0\\.5|1|1\\.5|2|2\\.5|3|3\\.5|4|5|6|8)'

export const spacingRestrictedSyntax = [
  {
    selector: `Literal[value=/\\b(gap|gap-x|gap-y|space-[xy])-${SPACING_SCALE}\\b/]`,
    message:
      'Use spacing token utilities (gap-space-*, space-y-space-*, gap-layout-*) or SPACING/LAYOUT from recipes.',
  },
  {
    selector: `TemplateElement[value.raw=/\\b(gap|gap-x|gap-y|space-[xy])-${SPACING_SCALE}\\b/]`,
    message:
      'Use spacing token utilities (gap-space-*, space-y-space-*, gap-layout-*) or SPACING/LAYOUT from recipes.',
  },
  {
    selector: `Literal[value=/\\b(p|px|py|pb|pt|pl|pr|mb|mt|ml|mr|my|mx)-${SPACING_SCALE}\\b/]`,
    message: 'Use spacing token utilities (p-space-*, px-space-*, etc.) or SPACING from recipes.',
  },
  {
    selector: `TemplateElement[value.raw=/\\b(p|px|py|pb|pt|pl|pr|mb|mt|ml|mr|my|mx)-${SPACING_SCALE}\\b/]`,
    message: 'Use spacing token utilities (p-space-*, px-space-*, etc.) or SPACING from recipes.',
  },
  {
    selector: `Literal[value=/\\b-?(top|bottom|left|right)-${INSET_SCALE}(?![0-9./])/]`,
    message: 'Use inset spacing tokens (top-space-*, right-space-*, etc.) or SPACING from recipes.',
  },
  {
    selector: `TemplateElement[value.raw=/\\b-?(top|bottom|left|right)-${INSET_SCALE}(?![0-9./])/]`,
    message: 'Use inset spacing tokens (top-space-*, right-space-*, etc.) or SPACING from recipes.',
  },
]

export const chromeRestrictedSyntax = [
  {
    selector: 'Literal[value=/\\bshadow-(sm|md|lg|xl)\\b/]',
    message: 'Use SHADOW.*, OVERLAY.*, or PANEL.* from @/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/\\bshadow-(sm|md|lg|xl)\\b/]',
    message: 'Use SHADOW.*, OVERLAY.*, or PANEL.* from @/theme/recipes.',
  },
  {
    selector: 'Literal[value=/ring-black\\//]',
    message: 'Use CONTROL.segmentActive (ring-ring-subtle) from @/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/ring-black\\//]',
    message: 'Use CONTROL.segmentActive (ring-ring-subtle) from @/theme/recipes.',
  },
  {
    selector: 'Literal[value=/\\bmin-h-\\[42px\\]/]',
    message: 'Use CONTROL.heightMultiline from @/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/\\bmin-h-\\[42px\\]/]',
    message: 'Use CONTROL.heightMultiline from @/theme/recipes.',
  },
  {
    selector: 'Literal[value=/\\bmin-h-\\[2\\.125rem\\]/]',
    message: 'Use min-h-control or CONTROL.minHeight from @/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/\\bmin-h-\\[2\\.125rem\\]/]',
    message: 'Use min-h-control or CONTROL.minHeight from @/theme/recipes.',
  },
  {
    selector: 'Literal[value=/focus-visible:outline-none focus-visible:ring-2/]',
    message: 'Use CONTROL.focusVisible, CONTROL.focusVisibleTight, or PROMO_CONTROL from recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/focus-visible:outline-none focus-visible:ring-2/]',
    message: 'Use CONTROL.focusVisible, CONTROL.focusVisibleTight, or PROMO_CONTROL from recipes.',
  },
  {
    selector: 'Literal[value=/focus:outline-none focus:ring-2 focus:ring-brand\\//]',
    message: 'Use CONTROL.focusBrand, CONTROL.focusBrandSoft, or PROMO_CONTROL from @/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/focus:outline-none focus:ring-2 focus:ring-brand\\//]',
    message: 'Use CONTROL.focusBrand, CONTROL.focusBrandSoft, or PROMO_CONTROL from @/theme/recipes.',
  },
]

/** Panel chrome belongs in panelPresets — call sites pass preset + slots only. */
export const panelPresetRestrictedSyntax = [
  {
    selector:
      'JSXOpeningElement[name.name="Panel"] > JSXAttribute[name.name=/^(title|variant|scroll|spacing|hideHeader|className|bodyClassName|footerClassName)$/]',
    message:
      'Use a Panel preset from @/components/surfaces. Do not pass title, variant, className, or other chrome props.',
  },
]

/** Raw hex colors in UI code — use tokens and @/theme/recipes. */
export const hexColorLiteralSyntax = [
  {
    selector: 'Literal[value=/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]',
    message: 'Use semantic color tokens or theme recipes, not hex literals in TSX.',
  },
  {
    selector: 'TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}/]',
    message: 'Use semantic color tokens or theme recipes, not hex literals in TSX.',
  },
]

export const allRestrictedSyntax = [
  ...designTokenRestrictedSyntax,
  ...spacingRestrictedSyntax,
  ...chromeRestrictedSyntax,
]
