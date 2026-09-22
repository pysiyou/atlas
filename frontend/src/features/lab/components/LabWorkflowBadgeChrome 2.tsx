import { type ReactNode } from 'react';
import { useLabHeaderCompact } from './LabWorkflowHeader';

export function CompactOnly({
  children,
  className = 'hidden lg:inline-flex items-center',
}: {
  children: ReactNode;
  className?: string;
}) {
  const compact = useLabHeaderCompact();
  if (!compact) return <>{children}</>;
  return <span className={className}>{children}</span>;
}

export function CompactMd({
  children,
  className = 'hidden md:inline-flex items-center',
}: {
  children: ReactNode;
  className?: string;
}) {
  const compact = useLabHeaderCompact();
  if (!compact) return <>{children}</>;
  return <span className={className}>{children}</span>;
}
