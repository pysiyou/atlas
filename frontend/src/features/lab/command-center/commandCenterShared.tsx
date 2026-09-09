/**
 * Shared command center UI — panel shell, KPI tiles, segmented bars, states.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Icon, type IconName } from '@/components';
import { cn } from '@/utils';
import {
  COMMAND_CENTER_CARD,
  COMMAND_CENTER_EXCEPTION,
  COMMAND_CENTER_EXCEPTION_ACCENT,
  COMMAND_CENTER_EXCEPTION_VALUE,
  COMMAND_CENTER_KPI,
  COMMAND_CENTER_KPI_RING_TONE,
  COMMAND_CENTER_KPI_TONE_ICON,
  COMMAND_CENTER_KPI_TONE_VALUE,
  COMMAND_CENTER_PANEL,
  COMMAND_CENTER_SECTION,
  COMMAND_CENTER_SEGMENT_BAR,
  COMMAND_CENTER_TIMELINE,
  type CommandCenterExceptionTone,
  type CommandCenterKpiTone,
} from './commandCenterStyles';

export interface SegmentItem {
  key: string;
  percentage: number;
  colorClass: string;
  title: string;
}

export function CommandCenterPanel({
  title,
  meta,
  headerActions,
  children,
  className,
}: {
  title: string;
  meta?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const headerClass = meta ? COMMAND_CENTER_PANEL.headerBetween : COMMAND_CENTER_PANEL.header;

  return (
    <div className={cn(COMMAND_CENTER_PANEL.shell, className)}>
      <div className={headerClass}>
        <h3 className={COMMAND_CENTER_PANEL.title}>{title}</h3>
        {meta && <span className={COMMAND_CENTER_PANEL.meta}>{meta}</span>}
        {headerActions}
      </div>
      {children}
    </div>
  );
}

export function CommandCenterPanelError({
  message,
  onRetry,
  retryLabel = 'Retry',
}: {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <p className="text-xs text-text-secondary">{message}</p>
      {onRetry && (
        <button type="button" onClick={() => void onRetry()} className={COMMAND_CENTER_TIMELINE.retryLink}>
          {retryLabel}
        </button>
      )}
    </div>
  );
}

export function CommandCenterPanelEmpty({ message }: { message: string }) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center py-8">
      <p className="text-xs text-text-tertiary">{message}</p>
    </div>
  );
}

export function SegmentedBar({
  segments,
  ariaLabel,
}: {
  segments: SegmentItem[];
  ariaLabel: string;
}) {
  const visible = segments.filter(item => item.percentage > 0);

  if (visible.length === 0) {
    return <div className={COMMAND_CENTER_SEGMENT_BAR.empty} aria-hidden />;
  }

  return (
    <div className={COMMAND_CENTER_SEGMENT_BAR.track} role="img" aria-label={ariaLabel}>
      {visible.map(item => (
        <div
          key={item.key}
          className={cn(COMMAND_CENTER_SEGMENT_BAR.segment, 'h-full', item.colorClass)}
          style={{ width: `${item.percentage}%` }}
          title={item.title}
        />
      ))}
    </div>
  );
}

export function CommandCenterSectionHeader({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className={COMMAND_CENTER_SECTION.header}>
      <h4 className={COMMAND_CENTER_SECTION.title}>{title}</h4>
      {detail && <span className={COMMAND_CENTER_SECTION.detail}>{detail}</span>}
    </div>
  );
}

export function CommandCenterCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={cn(COMMAND_CENTER_CARD.shell, className)}>{children}</section>;
}

function CompletionRing({
  value,
  tone = 'success',
  size = 36,
}: {
  value: number;
  tone?: CommandCenterKpiTone;
  size?: number;
}) {
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0 -rotate-90"
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        className={COMMAND_CENTER_KPI.ringTrack}
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        className={cn('transition-all duration-500', COMMAND_CENTER_KPI_RING_TONE[tone])}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CommandCenterKpiTile({
  icon,
  label,
  value,
  tone = 'neutral',
  denominator,
  ringValue,
  to,
}: {
  icon: IconName;
  label: string;
  value: number;
  tone?: CommandCenterKpiTone;
  denominator: number;
  ringValue: number;
  to?: string;
}) {
  const body = (
    <div className={cn(COMMAND_CENTER_KPI.tile, to && COMMAND_CENTER_KPI.tileInteractive)}>
      <div className={COMMAND_CENTER_KPI.iconWrap}>
        <Icon name={icon} className={cn('h-4 w-4', COMMAND_CENTER_KPI_TONE_ICON[tone])} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={COMMAND_CENTER_KPI.label}>{label}</p>
        <div className="flex min-w-0 items-baseline gap-1">
          <p className={cn(COMMAND_CENTER_KPI.value, COMMAND_CENTER_KPI_TONE_VALUE[tone])}>{value}</p>
          <span className={COMMAND_CENTER_KPI.context}>on {denominator}</span>
        </div>
      </div>
      <CompletionRing value={ringValue} tone={tone} />
    </div>
  );

  if (to) {
    return (
      <Link to={to} className={COMMAND_CENTER_KPI.tileLink}>
        {body}
      </Link>
    );
  }

  return <div className={COMMAND_CENTER_KPI.tileWrap}>{body}</div>;
}

export function CommandCenterExceptionTile({
  label,
  value,
  tone,
  to,
}: {
  label: string;
  value: number;
  tone: CommandCenterExceptionTone;
  to?: string;
}) {
  const content = (
    <div className={cn(COMMAND_CENTER_EXCEPTION.shell, COMMAND_CENTER_EXCEPTION_ACCENT[tone])}>
      <span className={COMMAND_CENTER_EXCEPTION.label}>{label}</span>
      <span className={cn(COMMAND_CENTER_EXCEPTION.value, COMMAND_CENTER_EXCEPTION_VALUE[tone])}>
        {value}
      </span>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className={COMMAND_CENTER_EXCEPTION.link}>
        {content}
      </Link>
    );
  }

  return content;
}
