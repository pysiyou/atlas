/** Design-token ESLint selectors (type, surface, radius, palette). Spacing is separate. */

export const designTokenRestrictedSyntax = [
  {
    selector: 'Literal[value=/text-\\[\\d+px\\]/]',
    message: 'Use the type scale (text-3xs through text-lg), not arbitrary px font sizes.',
  },
  {
    selector: 'TemplateElement[value.raw=/text-\\[\\d+px\\]/]',
    message: 'Use the type scale (text-3xs through text-lg), not arbitrary px font sizes.',
  },
  {
    selector: 'Literal[value=/text-xs text-text-secondary/]',
    message: 'Use TYPE.label from @/components/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/text-xs text-text-secondary/]',
    message: 'Use TYPE.label from @/components/theme/recipes.',
  },
  {
    selector: 'Literal[value=/text-xs text-text-primary/]',
    message: 'Use TYPE.value from @/components/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/text-xs text-text-primary/]',
    message: 'Use TYPE.value from @/components/theme/recipes.',
  },
  {
    selector: 'Literal[value=/text-xs text-text-tertiary/]',
    message: 'Use TYPE.meta from @/components/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/text-xs text-text-tertiary/]',
    message: 'Use TYPE.meta from @/components/theme/recipes.',
  },
  {
    selector: 'Literal[value=/text-xxs text-text-tertiary/]',
    message: 'Use TYPE.caption from @/components/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/text-xxs text-text-tertiary/]',
    message: 'Use TYPE.caption from @/components/theme/recipes.',
  },
  {
    selector: 'Literal[value=/text-sm font-medium text-text-primary/]',
    message: 'Use TYPE.detailTitle from @/components/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/text-sm font-medium text-text-primary/]',
    message: 'Use TYPE.detailTitle from @/components/theme/recipes.',
  },
  {
    selector: 'Literal[value=/text-sm text-text-primary/]',
    message: 'Use TYPE.amount from @/components/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/text-sm text-text-primary/]',
    message: 'Use TYPE.amount from @/components/theme/recipes.',
  },
  {
    selector: 'Literal[value=/bg-surface border border-border-default/]',
    message: 'Use SURFACE.raised from @/components/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/bg-surface border border-border-default/]',
    message: 'Use SURFACE.raised from @/components/theme/recipes.',
  },
  {
    selector: 'Literal[value=/bg-surface-page border border-border-default/]',
    message: 'Use SURFACE.recessed from @/components/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/bg-surface-page border border-border-default/]',
    message: 'Use SURFACE.recessed from @/components/theme/recipes.',
  },
  {
    selector: 'Literal[value=/bg-danger-bg border border-danger-stroke/]',
    message: 'Use TONE.danger.well or SURFACE.dangerWell from @/components/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/bg-danger-bg border border-danger-stroke/]',
    message: 'Use TONE.danger.well or SURFACE.dangerWell from @/components/theme/recipes.',
  },
  {
    selector: 'Literal[value=/(bg|text|border)-tone-/]',
    message: 'Use TONE from @/components/theme/recipes, not tone-* CSS classes.',
  },
  {
    selector: 'TemplateElement[value.raw=/(bg|text|border)-tone-/]',
    message: 'Use TONE from @/components/theme/recipes, not tone-* CSS classes.',
  },
  {
    selector: 'Literal[value=/rounded-\\[/]',
    message: 'Use RADIUS from @/components/theme/recipes, not arbitrary rounded-[Npx].',
  },
  {
    selector: 'TemplateElement[value.raw=/rounded-\\[/]',
    message: 'Use RADIUS from @/components/theme/recipes, not arbitrary rounded-[Npx].',
  },
  {
    selector: 'Literal[value=/h-\\[34px\\]/]',
    message: 'Use CONTROL.height from @/components/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/h-\\[34px\\]/]',
    message: 'Use CONTROL.height from @/components/theme/recipes.',
  },
  {
    selector: 'Literal[value=/focus:outline-none focus:ring-1 focus:ring-brand focus:ring-opacity-20 focus:border-brand/]',
    message: 'Use CONTROL.focus from @/components/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/focus:outline-none focus:ring-1 focus:ring-brand focus:ring-opacity-20 focus:border-brand/]',
    message: 'Use CONTROL.focus from @/components/theme/recipes.',
  },
  {
    selector: 'Literal[value=/focus-within:outline-none focus-within:border-brand focus-within:ring-1 focus-within:ring-brand focus-within:ring-opacity-20/]',
    message: 'Use CONTROL.focusWithin from @/components/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/focus-within:outline-none focus-within:border-brand focus-within:ring-1 focus-within:ring-brand focus-within:ring-opacity-20/]',
    message: 'Use CONTROL.focusWithin from @/components/theme/recipes.',
  },
  {
    selector: 'Literal[value=/border-border-error focus:border-border-error focus:ring-danger focus:ring-opacity-20/]',
    message: 'Use CONTROL.error from @/components/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/border-border-error focus:border-border-error focus:ring-danger focus:ring-opacity-20/]',
    message: 'Use CONTROL.error from @/components/theme/recipes.',
  },
  {
    selector: 'Literal[value=/border-border-error focus-within:border-border-error focus-within:ring-danger focus-within:ring-opacity-20/]',
    message: 'Use CONTROL.errorWithin from @/components/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/border-border-error focus-within:border-border-error focus-within:ring-danger focus-within:ring-opacity-20/]',
    message: 'Use CONTROL.errorWithin from @/components/theme/recipes.',
  },
  {
    selector: 'Literal[value=/\\brounded-full\\b/]',
    message: 'Use RADIUS.pill from @/components/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/\\brounded-full\\b/]',
    message: 'Use RADIUS.pill from @/components/theme/recipes.',
  },
  {
    selector: 'Literal[value=/\\brounded-sm\\b/]',
    message: 'Use RADIUS.field from @/components/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/\\brounded-sm\\b/]',
    message: 'Use RADIUS.field from @/components/theme/recipes.',
  },
  {
    selector: 'Literal[value=/\\brounded-xs\\b/]',
    message: 'Use RADIUS.pill or RADIUS.field from @/components/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/\\brounded-xs\\b/]',
    message: 'Use RADIUS.pill or RADIUS.field from @/components/theme/recipes.',
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
    selector: 'Literal[value=/\\brounded-(field|pill|surface|menu|menu-item|workspace|notice|button|b-surface)\\b/]',
    message: 'Use RADIUS from @/components/theme/recipes, not inline token class names.',
  },
  {
    selector: 'TemplateElement[value.raw=/\\brounded-(field|pill|surface|menu|menu-item|workspace|notice|button|b-surface)\\b/]',
    message: 'Use RADIUS from @/components/theme/recipes, not inline token class names.',
  },
  {
    selector: 'Literal[value=/\\brounded-md\\b/]',
    message: 'Use RADIUS.surface from @/components/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/\\brounded-md\\b/]',
    message: 'Use RADIUS.surface from @/components/theme/recipes.',
  },
  {
    selector: 'Literal[value=/\\brounded-lg\\b/]',
    message: 'Use RADIUS.menu from @/components/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/\\brounded-lg\\b/]',
    message: 'Use RADIUS.menu from @/components/theme/recipes.',
  },
  {
    selector: 'Literal[value=/\\brounded-xl\\b/]',
    message: 'Use RADIUS.menu from @/components/theme/recipes.',
  },
  {
    selector: 'TemplateElement[value.raw=/\\brounded-xl\\b/]',
    message: 'Use RADIUS.menu from @/components/theme/recipes.',
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

export const allRestrictedSyntax = [...designTokenRestrictedSyntax, ...spacingRestrictedSyntax]
