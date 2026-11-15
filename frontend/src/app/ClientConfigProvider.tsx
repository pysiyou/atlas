import { type ReactNode } from 'react';
import type { ClientConfig } from '@/config';
import { ClientConfigContext, type ConfigStatus } from './clientConfigContext';

interface ClientConfigProviderProps {
  children: ReactNode;
  config: ClientConfig | null;
  status: ConfigStatus;
  error?: Error;
}

export function ClientConfigProvider({
  children,
  config,
  status,
  error,
}: ClientConfigProviderProps) { return (
  <ClientConfigContext.Provider value={{ config, status, error }}>{children}</ClientConfigContext.Provider>
); }