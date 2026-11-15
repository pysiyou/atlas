/**
 * Icon registry — import via `@/icons` only.
 */
export type { IconAsset, IconKey } from './registry';
export {
  FEEDBACK_ICON_KEYS,
  ICON_ASSETS,
  IconKeys,
  INLINE_HIGHLIGHT_ICON_KEYS,
  TOAST_ICON_KEYS,
  getContainerIcon,
  getDataFieldIcon,
  getOrderStatusIcon,
  getPriorityIcon,
  parseIconKey,
  resolveIconKey,
} from './registry';