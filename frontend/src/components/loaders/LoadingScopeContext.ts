import { createContext } from 'react';
import type { LoadingScopeContextValue } from './loadingScopeState';

export const LoadingScopeContext = createContext<LoadingScopeContextValue | null>(null);
