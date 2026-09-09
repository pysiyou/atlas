/**
 * Compact stat rows and section labels for panel detail grids.
 */

import { Link } from 'react-router-dom';
import { cn } from '@/utils';
import type { CommandCenterKpiTone } from './styles';

export function SectionLabel({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="mb-1 flex items-center justify-between gap-2">
      <span className="text-[9px] font-medium uppercase tracking-wide text-text-tertiary">{title}</span>
      {detail && <span className="text-[9px] tabular-nums text-text-tertiary">{detail}</span>}
    </div>
  );
}

export function kpiToneToStat(tone: CommandCenterKpiTone): 'default' | 'success' | 'warning' | 'danger' {
  if (tone === 'success') return 'success';
  if (tone === 'warning') return 'warning';
  if (tone === 'danger') return 'danger';
  return 'default';
}

export function StatRow({
  label,
  value,
  suffix,
  tone = 'default',
  href,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
  href?: string;
}) {
  const valueClass = {
    default: 'text-text-primary',
    success: 'text-success-fg-emphasis',
    warning: 'text-warning-fg-emphasis',
    danger: 'text-danger-fg-emphasis',
  }[tone];

  const content = (
    <div className="flex items-center justify-between gap-2 text-xxs">
      <span className="truncate text-text-secondary">{label}</span>
      <span className={cn('shrink-0 tabular-nums font-medium', valueClass)}>
        {value}
        {suffix && <span className="ml-0.5 font-normal text-text-tertiary">{suffix}</span>}
      </span>
    </div>
  );

  if (href) {
    return (
      <Link to={href} className="block rounded hover:bg-surface-hover/60">
        {content}
      </Link>
    );
  }

  return content;
}
