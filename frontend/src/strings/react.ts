import { useClientConfig } from '@/app/clientConfigContext';
import { getModuleListTitles } from '@/strings/index';

/** Module list/detail titles that refresh when client config loads. */
export function useModuleListTitles() {
  useClientConfig();
  return getModuleListTitles();
}