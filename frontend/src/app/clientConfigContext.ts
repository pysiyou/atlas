import { createContext, useContext } from 'react';
import type { ClientConfig } from '@/config';

export type ConfigStatus = 'loading' | 'ready' | 'error';

export interface ClientConfigContextValue {
  config: ClientConfig | null;
  status: ConfigStatus;
  error?: Error;
}

export const ClientConfigContext = createContext<ClientConfigContextValue | undefined>(undefined);

export function useClientConfig() {
  const context = useContext(ClientConfigContext);
  if (context === undefined) {
    throw new Error('useClientConfig must be used within ClientConfigProvider');
  }
  return context;
}

export function useClientConfigReady(): ClientConfig {
  const { config, status, error } = useClientConfig();
  if (status === 'loading') {
    throw new Promise(() => {});
  }
  if (status === 'error' || !config) {
    throw error || new Error('Configuration failed to load');
  }
  return config;
}