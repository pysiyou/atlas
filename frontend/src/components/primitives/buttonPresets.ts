/**
 * Base button presets — prefer these over semantic `Button` variants.
 */

import { ICONS, MODULE_ICONS } from '@/config/icons';
import type { IconName } from './Icon';
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
  | 'home'
  | 'confirm'
  | 'expand'
  | 'collapse'
  | 'sidebarClose'
  | 'menu';

const PRESETS: Record<
  ActionButtonPreset,
  { variant: BaseVariant; iconName: IconName; layout?: ButtonLayout }
> = {
  save: { variant: 'primary', iconName: ICONS.actions.save, layout: 'icon-text' },
  submit: { variant: 'primary', iconName: ICONS.actions.check, layout: 'icon-text' },
  approve: { variant: 'success', iconName: ICONS.actions.like, layout: 'icon-text' },
  collect: { variant: 'primary', iconName: MODULE_ICONS.laboratory, layout: 'icon-text' },
  confirm: { variant: 'success', iconName: ICONS.actions.check, layout: 'icon-text' },
  add: { variant: 'primary', iconName: ICONS.actions.add, layout: 'icon-text' },
  create: { variant: 'primary', iconName: ICONS.actions.add, layout: 'icon-text' },
  edit: { variant: 'primary', iconName: ICONS.actions.edit, layout: 'icon-text' },
  cancel: { variant: 'outline', iconName: ICONS.actions.cross, layout: 'icon-text' },
  close: { variant: 'ghost', iconName: ICONS.actions.cross },
  back: { variant: 'outline', iconName: ICONS.actions.arrowLeft, layout: 'icon-text' },
  previous: { variant: 'outline', iconName: ICONS.actions.chevronLeft, layout: 'icon-text' },
  next: { variant: 'primary', iconName: ICONS.actions.chevronRight, layout: 'icon-text' },
  home: { variant: 'primary', iconName: ICONS.actions.home, layout: 'icon-text' },
  expand: { variant: 'secondary', iconName: ICONS.actions.chevronDown, layout: 'icon-text' },
  collapse: { variant: 'secondary', iconName: ICONS.actions.chevronLeft, layout: 'icon-text' },
  sidebarClose: { variant: 'ghost', iconName: ICONS.actions.doubleArrowLeft },
  menu: { variant: 'primary', iconName: ICONS.actions.menuDots, layout: 'icon-text' },
  delete: { variant: 'danger', iconName: ICONS.actions.delete, layout: 'icon-text' },
  reject: { variant: 'danger', iconName: ICONS.actions.dislike, layout: 'icon-text' },
  retry: { variant: 'primary', iconName: ICONS.actions.loading, layout: 'icon-text' },
  refresh: { variant: 'secondary', iconName: ICONS.actions.loading, layout: 'icon-text' },
  print: { variant: 'secondary', iconName: ICONS.actions.printer, layout: 'icon-text' },
  view: { variant: 'secondary', iconName: ICONS.actions.view, layout: 'icon-text' },
  download: { variant: 'secondary', iconName: ICONS.actions.download, layout: 'icon-text' },
  filter: { variant: 'primary', iconName: ICONS.actions.filter, layout: 'icon-text' },
  search: { variant: 'primary', iconName: ICONS.actions.search, layout: 'icon-text' },
  logout: { variant: 'danger', iconName: ICONS.actions.logout, layout: 'icon-text' },
  remove: { variant: 'danger', iconName: ICONS.actions.cross, layout: 'icon-text' },
};

export function actionButtonPreset(
  action: ActionButtonPreset,
  overrides?: { size?: ButtonSize; layout?: ButtonLayout }
): {
  variant: BaseVariant;
  iconName: IconName;
  layout?: ButtonLayout;
  size?: ButtonSize;
} {
  const preset = PRESETS[action];
  return { ...preset, ...overrides };
}
