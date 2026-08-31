import React from 'react';
import { Badge, type BadgeVariant } from '@/components/primitives/Badge';
import { Icon, type IconName } from '@/components/primitives/Icon';
import { DETAIL_LABEL, DETAIL_VALUE } from '@/utils/constants';
import { formatDate } from '@/utils';
import { useUserLookup } from '@/lib/api/users.api';

/**
 * Badge configuration for DetailField
 */
interface BadgeConfig {
  value: string;
  variant?: BadgeVariant;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

type DetailFieldVariant = 'default' | 'stacked' | 'inline';

interface DetailFieldProps {
  label: string;
  value?: React.ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  variant?: DetailFieldVariant;
  /** Layout orientation for icon + label + value blocks */
  orientation?: 'horizontal' | 'vertical';
  /** Optional icon before label */
  icon?: IconName;
  timestamp?: string;
  user?: string;
  badge?: BadgeConfig;
}

export const DetailField: React.FC<DetailFieldProps> = ({
  label,
  value,
  className = '',
  labelClassName = DETAIL_LABEL,
  valueClassName = `font-normal text-right ${DETAIL_VALUE}`,
  variant = 'default',
  orientation = 'horizontal',
  icon,
  timestamp,
  user,
  badge,
}) => {
  const { getUserName } = useUserLookup();

  const renderValue = () => {
    if (badge?.value) {
      return (
        <Badge variant={badge.variant || 'primary'} size={badge.size || 'xs'} className={badge.className}>
          {badge.value.toUpperCase()}
        </Badge>
      );
    }

    if (timestamp) {
      const formattedDate = formatDate(timestamp);
      const userName = user ? getUserName(user) : null;

      if (userName) {
        return (
          <div className="text-right">
            <div className={DETAIL_VALUE}>{formattedDate}</div>
            <div className={DETAIL_LABEL}>by {userName}</div>
          </div>
        );
      }

      return <span className={DETAIL_VALUE}>{formattedDate}</span>;
    }

    return value;
  };

  if (orientation === 'vertical') {
    return (
      <div className={`flex gap-3 ${className}`}>
        {icon && <Icon name={icon} className="w-4 h-4 text-text-disabled shrink-0" />}
        <div className="min-w-0 flex-1">
          <div className={DETAIL_LABEL}>{label}</div>
          <div className={`font-normal mt-0.5 leading-relaxed ${DETAIL_VALUE}`}>{renderValue()}</div>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        <span className={labelClassName}>{label}:</span>
        <span className={valueClassName}>{renderValue()}</span>
      </span>
    );
  }

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-2 min-w-0">
        {icon && <Icon name={icon} className="w-4 h-4 text-text-tertiary flex-shrink-0" />}
        <span className={`font-normal whitespace-nowrap ${labelClassName}`}>{label}</span>
      </div>
      <span className={`text-right min-w-0 ${valueClassName}`}>{renderValue()}</span>
    </div>
  );
};
