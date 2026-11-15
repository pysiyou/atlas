import React, { type ReactNode } from 'react';
import type { ClientConfig } from '@/config';
import { ClientConfigContext, type ConfigStatus } from './clientConfigContext';

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
}) => (
  <ClientConfigContext.Provider value={{ config, status, error }}>{children}</ClientConfigContext.Provider>
);