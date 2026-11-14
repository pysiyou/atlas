import React, { type ReactNode } from 'react';
import type { ClientConfig } from './clientConfig';
import {
  ClientConfigContext,
  type ConfigStatus,
} from './clientConfigContext';

interface ClientConfigProviderProps {
  children: ReactNode;
  config: ClientConfig | null;
  status: ConfigStatus;
  error?: Error;
}

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