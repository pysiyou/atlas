/**
 * Client Configuration Context
 * 
 * Provides centralized access to white-label configuration throughout the app.
 * Eliminates timing races by holding config state and blocking UI until ready.
 */
import React, { createContext, useContext, ReactNode } from 'react';
import type { ClientConfig } from './clientConfig';

type ConfigStatus = 'loading' | 'ready' | 'error';

interface ClientConfigContextValue {
  config: ClientConfig | null;
  status: ConfigStatus;
  error?: Error;
}

const ClientConfigContext = createContext<ClientConfigContextValue | undefined>(undefined);

interface ClientConfigProviderProps {
  children: ReactNode;
  config: ClientConfig | null;
  status: ConfigStatus;
  error?: Error;
}

/**
 * Provider component that holds the loaded client configuration.
 * Wraps the app to provide configuration to all components.
 */
export const ClientConfigProvider: React.FC<ClientConfigProviderProps> = ({
  children,
  config,
  status,
  error,
}) => {
  return (
    <ClientConfigContext.Provider value={{ config, status, error }}>
      {children}
    </ClientConfigContext.Provider>
  );
};

/**
 * Hook to access client configuration in React components.
 * 
 * @throws Error if used outside of ClientConfigProvider
 * @returns Configuration context with config, status, and optional error
 * 
 * @example
 * const { config, status } = useClientConfig();
 * if (status === 'loading') return <Spinner />;
 * return <div>{config?.company.displayName}</div>;
 */
export function useClientConfig(): ClientConfigContextValue {
  const context = useContext(ClientConfigContext);
  
  if (context === undefined) {
    throw new Error('useClientConfig must be used within ClientConfigProvider');
  }
  
  return context;
}

/**
 * Hook that returns config only when ready, or throws during loading.
 * Useful for components that must have config available.
 * 
 * @throws Error if config is not loaded or loading failed
 * @returns ClientConfig when ready
 * 
 * @example
 * const config = useClientConfigReady();
 * // config is guaranteed to be non-null here
 * return <div>{config.company.displayName}</div>;
 */
export function useClientConfigReady(): ClientConfig {
  const { config, status, error } = useClientConfig();
  
  if (status === 'loading') {
    throw new Promise(() => {}); // Suspend if using with React Suspense
  }
  
  if (status === 'error' || !config) {
    throw error || new Error('Configuration failed to load');
  }
  
  return config;
}
