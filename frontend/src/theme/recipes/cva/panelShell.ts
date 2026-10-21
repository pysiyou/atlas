import { cva, type VariantProps } from 'class-variance-authority';
import { PANEL_SHELL } from '../panel';

const shellByVariant = {
  page: PANEL_SHELL.page.shell,
  pageEmbed: PANEL_SHELL.pageEmbed.shell,
  compact: PANEL_SHELL.compact.shell,
  compactEmbed: PANEL_SHELL.compactEmbed.shell,
} as const;

export const panelShell = cva('', {
  variants: {
    variant: {
      page: shellByVariant.page,
      pageEmbed: shellByVariant.pageEmbed,
      compact: shellByVariant.compact,
      compactEmbed: shellByVariant.compactEmbed,
    },
    elevation: {
      raised: '',
      recessed: '',
      flat: 'shadow-none',
    },
  },
  defaultVariants: {
    variant: 'page',
    elevation: 'raised',
  },
});

export type PanelShellRecipeProps = VariantProps<typeof panelShell>;

export function panelBodyClass(
  variant: NonNullable<PanelShellRecipeProps['variant']>
): string {
  return PANEL_SHELL[variant].body;
}
