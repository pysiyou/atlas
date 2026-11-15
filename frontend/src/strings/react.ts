import { useClientConfig } from '@/app/clientConfigContext';
import {
  getEventLogCopy,
  getModuleListTitles,
  getNavCopy,
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
