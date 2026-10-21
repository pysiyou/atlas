/**
 * Generic description / label-value layouts (detail panels, modals, audit).
 */

import React from 'react';
import { Badge, type BadgeVariant } from '@/components/primitives';
import { Icon, type IconName } from '@/components/primitives/Icon';
import { Text } from '@/components/layout/Text';
import { SPACING, text } from '@/theme/recipes';
import { formatDateTime } from '@/utils';
import { cn } from '@/utils';

const defaultLabelClass = text({ role: 'label' });
const defaultValueClass = `font-normal text-right ${text({ role: 'body' })}`;

interface ItemBadgeConfig {
  value: string;
  variant?: BadgeVariant;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export type DescriptionItemVariant = 'default' | 'stacked' | 'inline';

export interface DescriptionItemProps {
  label: string;
  value?: React.ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  variant?: DescriptionItemVariant;
  orientation?: 'horizontal' | 'vertical';
  icon?: IconName;
  span?: 'full';
  timestamp?: string;
  userDisplay?: string;
  badge?: ItemBadgeConfig;
}

export function DescriptionItem({
  label,
  value,
  className = '',
  labelClassName = defaultLabelClass,
  valueClassName = defaultValueClass,
  variant = 'default',
  orientation = 'horizontal',
  icon,
  timestamp,
  userDisplay,
  badge,
}: DescriptionItemProps) {
  const renderValue = () => {
    if (badge?.value) {
      return (
        <Badge
          variant={badge.variant || 'primary'}
          size={badge.size || 'xs'}
          className={badge.className}
          label={badge.value.toUpperCase()}
        />
      );
    }
    if (timestamp) {
      const formattedDate = formatDateTime(timestamp);
      if (userDisplay) {
        return (
          <div className="text-right">
            <Text as="div" role="body">{formattedDate}</Text>
            <Text role="body" intent="muted">by {userDisplay}</Text>
          </div>
        );
      }
      return <Text role="body">{formattedDate}</Text>;
    }
    return value;
  };

  if (orientation === 'vertical') {
    return (
      <div className={`flex items-start gap-space-3 min-w-0 w-full ${className}`}>
        {icon && <Icon name={icon} className="mt-space-0-5 w-4 h-4 shrink-0 text-text-disabled" />}
        <div className="min-w-0 flex-1">
          <Text role="label">{label}</Text>
          <div className={`mt-space-0-5 text-left break-words whitespace-normal ${text({ role: 'body' })}`}>
            {renderValue()}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-space-1-5 ${className}`}>
        <span className={labelClassName}>{label}:</span>
        <span className={valueClassName}>{renderValue()}</span>
      </span>
    );
  }

  return (
    <div className={`flex items-start justify-between gap-layout-section ${className}`}>
      <div className="flex items-start gap-space-2 min-w-0 shrink-0">
        {icon && <Icon name={icon} className="mt-space-0-5 w-4 h-4 text-text-tertiary flex-shrink-0" />}
        <span className={`font-normal whitespace-nowrap ${labelClassName}`}>{label}</span>
      </div>
      <div className={`text-right min-w-0 flex-1 break-words whitespace-normal ${valueClassName}`}>
        {renderValue()}
      </div>
    </div>
  );
}

export interface DescriptionListItemConfig {
  label: string;
  value?: React.ReactNode;
  timestamp?: string;
  user?: string;
  userDisplay?: string;
  badge?: ItemBadgeConfig;
  valueClassName?: string;
  hidden?: boolean;
}

export interface DescriptionListProps {
  items: DescriptionListItemConfig[];
  className?: string;
  spacing?: 'tight' | 'normal' | 'loose';
  resolveUserDisplay?: (userId: string) => string | undefined;
}

const SPACING_CLASSES = {
  tight: SPACING.stackCompact,
  normal: SPACING.stackNormal,
  loose: SPACING.stackRelaxed,
};

export function DescriptionList({
  items,
  className = '',
  spacing = 'normal',
  resolveUserDisplay,
}: DescriptionListProps) {
  const source = items;
  const visible = source.filter(field => {
    if (field.hidden) return false;
    const hasValue = field.value !== undefined && field.value !== null && field.value !== '';
    const hasTimestamp = field.timestamp !== undefined && field.timestamp !== '';
    const hasBadge = field.badge?.value !== undefined && field.badge?.value !== '';
    return hasValue || hasTimestamp || hasBadge;
  });

  if (visible.length === 0) return null;

  return (
    <div className={`${SPACING_CLASSES[spacing]} ${className}`}>
      {visible.map(field => (
        <DescriptionItem
          key={field.label}
          label={field.label}
          value={field.value}
          timestamp={field.timestamp}
          userDisplay={
            field.userDisplay ??
            (field.user && resolveUserDisplay ? resolveUserDisplay(field.user) : undefined)
          }
          badge={field.badge}
          valueClassName={field.valueClassName}
        />
      ))}
    </div>
  );
}

export interface DescriptionColumnsProps {
  children: React.ReactNode;
  className?: string;
  scrollable?: boolean;
}

function splitIntoColumns(items: React.ReactNode[]): [React.ReactNode[], React.ReactNode[]] {
  const splitAt = Math.ceil(items.length / 2);
  return [items.slice(0, splitAt), items.slice(splitAt)];
}

function DescriptionColumn({ items }: { items: React.ReactNode[] }) {
  return (
    <div className={cn('flex min-w-0 flex-col', SPACING.gapRelaxed)}>
      {items.map((child, index) => (
        <div key={index} className="min-w-0 w-full">
          {child}
        </div>
      ))}
    </div>
  );
}

export function DescriptionColumns({
  children,
  className,
  scrollable = true,
}: DescriptionColumnsProps) {
  const items = React.Children.toArray(children).filter(Boolean);
  const [firstColumn, secondColumn] = splitIntoColumns(items);

  const grid = (
    <div
      className={cn(
        'grid w-full min-h-0 grid-cols-1 items-start gap-x-layout-section sm:grid-cols-2',
        className
      )}
    >
      <DescriptionColumn items={firstColumn} />
      {secondColumn.length > 0 ? <DescriptionColumn items={secondColumn} /> : null}
    </div>
  );

  if (!scrollable) return grid;
  return <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{grid}</div>;
}
