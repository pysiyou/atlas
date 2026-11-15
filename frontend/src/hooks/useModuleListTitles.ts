import { getModuleListTitles } from '@/copy';
import { useClientConfig } from '@/app/clientConfigContext';

/** Module list/detail titles that refresh when client config loads. */
export function useModuleListTitles() {
  useClientConfig();
  return getModuleListTitles();
}