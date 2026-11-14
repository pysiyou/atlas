import { useMemo } from 'react';
import { useClientConfig } from './ClientConfigContext';
import { getModuleListTitles } from './pageCopy';

/** Module list/detail titles that refresh when client config loads */
export function useModuleListTitles() {
  const { status } = useClientConfig();
  return useMemo(() => getModuleListTitles(), [status]);
}