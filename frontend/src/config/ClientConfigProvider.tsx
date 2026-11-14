import React, { type ReactNode } from 'react';
import {
  ClientConfigContext,
  type ClientConfig,
  type ConfigStatus,
} from './domain/client';

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