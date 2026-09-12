/**
 * Section heading primitives for command center panels.
 */

import { cn } from '@/utils';
import { COMMAND_CENTER_SECTION } from './styles';

export function SectionTitle({
  title,
  aside,
  className,
}: {
  title: string;
  aside?: string;
  className?: string;
}) {
  if (!aside) {
    return <p className={cn(COMMAND_CENTER_SECTION.title, className)}>{title}</p>;
  }

  return (
    <div className={cn('flex items-baseline justify-between gap-2', className)}>
      <p className={COMMAND_CENTER_SECTION.title}>{title}</p>
      <span className={COMMAND_CENTER_SECTION.aside}>{aside}</span>
    </div>
  );
}

export function ColumnHeader({
  title,
  aside,
  className,
}: {
  title: string;
  aside?: string;
  className?: string;
}) {
  return <SectionTitle title={title} aside={aside} className={className} />;
}
