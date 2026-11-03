/**
 * Base button presets — prefer these over semantic `Button` variants.
 */

import { IconKeys } from '@/config/icons';
import type { IconKey } from '@/config/icons';
import type { BaseVariant, ButtonLayout, ButtonSize } from './Button';

export type ActionButtonPreset =
  | 'save'
  | 'cancel'
  | 'delete'
  | 'reject'
  | 'approve'
  | 'collect'
  | 'edit'
  | 'add'
  | 'create'
  | 'close'
  | 'next'
  | 'previous'
  | 'submit'
  | 'retry'
  | 'refresh'
  | 'print'
  | 'view'
  | 'download'
  | 'filter'
  | 'search'
  | 'back'
  | 'logout'
  | 'remove'
  | 'confirm'
  | 'expand'
  | 'collapse'
  | 'sidebarClose'
  | 'menu';

const PRESETS: Record<
  ActionButtonPreset,
  { variant: BaseVariant; iconKey: IconKey; layout?: ButtonLayout }
> = {
  save: { variant: 'primary', iconKey: IconKeys.actions.save, layout: 'icon-text' },
  submit: { variant: 'primary', iconKey: IconKeys.actions.check, layout: 'icon-text' },
  approve: { variant: 'success', iconKey: IconKeys.actions.like, layout: 'icon-text' },
  collect: { variant: 'primary', iconKey: IconKeys.modules.laboratory, layout: 'icon-text' },
  confirm: { variant: 'success', iconKey: IconKeys.actions.check, layout: 'icon-text' },
  add: { variant: 'primary', iconKey: IconKeys.actions.add, layout: 'icon-text' },
  create: { variant: 'primary', iconKey: IconKeys.actions.add, layout: 'icon-text' },
  edit: { variant: 'primary', iconKey: IconKeys.actions.edit, layout: 'icon-text' },
  cancel: { variant: 'outline', iconKey: IconKeys.actions.close, layout: 'icon-text' },
  close: { variant: 'danger', iconKey: IconKeys.actions.close },
  back: { variant: 'outline', iconKey: IconKeys.actions.arrowLeft, layout: 'icon-text' },
  previous: { variant: 'outline', iconKey: IconKeys.actions.chevronLeft, layout: 'icon-text' },
  next: { variant: 'primary', iconKey: IconKeys.actions.chevronRight, layout: 'icon-text' },
  expand: { variant: 'secondary', iconKey: IconKeys.actions.chevronDown, layout: 'icon-text' },
  collapse: { variant: 'secondary', iconKey: IconKeys.actions.chevronLeft, layout: 'icon-text' },
  sidebarClose: { variant: 'ghost', iconKey: IconKeys.actions.arrowLeft },
  menu: { variant: 'primary', iconKey: IconKeys.actions.menuDots, layout: 'icon-text' },
  delete: { variant: 'danger', iconKey: IconKeys.actions.delete, layout: 'icon-text' },
  reject: { variant: 'danger', iconKey: IconKeys.actions.dislike, layout: 'icon-text' },
  retry: { variant: 'primary', iconKey: IconKeys.actions.loading, layout: 'icon-text' },
  refresh: { variant: 'secondary', iconKey: IconKeys.actions.loading, layout: 'icon-text' },
  print: { variant: 'secondary', iconKey: IconKeys.actions.printer, layout: 'icon-text' },
  view: { variant: 'secondary', iconKey: IconKeys.actions.view, layout: 'icon-text' },
  download: { variant: 'secondary', iconKey: IconKeys.actions.download, layout: 'icon-text' },
  filter: { variant: 'primary', iconKey: IconKeys.actions.filter, layout: 'icon-text' },
  search: { variant: 'primary', iconKey: IconKeys.actions.search, layout: 'icon-text' },
  logout: { variant: 'danger', iconKey: IconKeys.actions.logout, layout: 'icon-text' },
  remove: { variant: 'danger', iconKey: IconKeys.actions.close, layout: 'icon-text' },
};

export function actionButtonPreset(
  action: ActionButtonPreset,
  overrides?: { size?: ButtonSize; layout?: ButtonLayout }
): {
  variant: BaseVariant;
  iconKey: IconKey;
  layout?: ButtonLayout;
  size?: ButtonSize;
} {
  const preset = PRESETS[action];
  return { ...preset, ...overrides };
}
