import { createContext } from 'react';
import type { ClientConfig } from './clientConfig';

export type ConfigStatus = 'loading' | 'ready' | 'error';

export interface ClientConfigContextValue {
  config: ClientConfig | null;
  status: ConfigStatus;
  error?: Error;
}

export const ClientConfigContext = createContext<ClientConfigContextValue | undefined>(
  undefined,
);