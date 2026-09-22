import { createContext, useContext } from 'react';

export const AppChromeMountContext = createContext<HTMLElement | null>(null);

export function useAppChromeMount(): HTMLElement | null {
  return useContext(AppChromeMountContext);
}
