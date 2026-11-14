import { useClientConfig } from './clientConfigHooks';
import { getModuleListTitles } from './pageCopy';

/** Module list/detail titles that refresh when client config loads */
export function useModuleListTitles() {
  useClientConfig();
  return getModuleListTitles();
}