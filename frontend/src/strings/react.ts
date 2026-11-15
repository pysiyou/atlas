import { useClientConfig } from '@/app/clientConfigContext';
import {
  getEventLogCopy,
  getLabCopy,
  getModuleListTitles,
  getNavCopy,
  getPanelCopy,
} from './catalog';

/** Module list/detail titles that refresh when client config loads. */
export function useModuleListTitles() {
  useClientConfig();
  return getModuleListTitles();
}

/** Sidebar chrome labels that refresh when client config loads. */
export function useNavCopy() {
  useClientConfig();
  return getNavCopy();
}

/** Event log copy that refreshes when client config loads. */
export function useEventLogCopy() {
  useClientConfig();
  return getEventLogCopy();
}

/** Lab copy that refreshes when client config loads. */
export function useLabCopy() {
  useClientConfig();
  return getLabCopy();
}

/** Panel/modal/section titles that refresh when client config loads. */
export function usePanelCopy() {
  useClientConfig();
  return getPanelCopy();
}
