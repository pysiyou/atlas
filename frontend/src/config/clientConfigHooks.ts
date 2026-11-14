import { useContext } from 'react';
import { ClientConfigContext } from './clientConfigContext';
import type { ClientConfig } from './clientConfig';

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