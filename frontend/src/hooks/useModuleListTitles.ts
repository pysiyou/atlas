import { getModuleListTitles } from '@/strings';
import { useClientConfig } from '@/app/clientConfigContext';

/** Module list/detail titles that refresh when client config loads. */
export function useModuleListTitles() {
  useClientConfig();
  return getModuleListTitles();
}