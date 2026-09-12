/**
 * Footer note under a panel section.
 */

import type { ReactNode } from 'react';
import { COMMAND_CENTER_SECTION } from '../components/styles';

export function PanelNote({ children }: { children: ReactNode }) {
  return <p className={COMMAND_CENTER_SECTION.summary}>{children}</p>;
}
