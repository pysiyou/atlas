import React from 'react';
import { Badge, type BadgeVariant } from '@/components';
import { Icon, type IconName } from '@/components/primitives/Icon';
import { DETAIL_LABEL, DETAIL_VALUE } from '@/utils/constants';
import { formatDateTime } from '@/utils';

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
  orientation?: 'horizontal' | 'vertical';
  icon?: IconName;
  span?: 'full';
  timestamp?: string;
  /** Resolved display name for audit lines (pass from feature layer). */
  userDisplay?: string;
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
  userDisplay,
  badge,
}) => {
  const renderValue = () => {
    if (badge?.value) {
      return (
        <Badge variant={badge.variant || 'primary'} size={badge.size || 'xs'} className={badge.className} label={badge.value.toUpperCase()} />
      );
    }

    if (timestamp) {
      const formattedDate = formatDateTime(timestamp);

      if (userDisplay) {
        return (
          <div className="text-right">
            <div className={DETAIL_VALUE}>{formattedDate}</div>
            <div className={DETAIL_LABEL}>by {userDisplay}</div>
          </div>
        );
      }

      return <span className={DETAIL_VALUE}>{formattedDate}</span>;
    }

    return value;
  };

  if (orientation === 'vertical') {
    return (
      <div className={`flex items-start gap-space-3 min-w-0 w-full ${className}`}>
        {icon && (
          <Icon name={icon} className="mt-space-0-5 w-4 h-4 shrink-0 text-text-disabled" />
        )}
        <div className="min-w-0 flex-1">
          <div className={DETAIL_LABEL}>{label}</div>
          <div
            className={`mt-space-0-5 font-normal leading-relaxed text-left break-words whitespace-normal ${DETAIL_VALUE}`}
          >
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
    <div className={`flex items-center justify-between gap-layout-section ${className}`}>
      <div className="flex items-center gap-space-2 min-w-0">
        {icon && <Icon name={icon} className="w-4 h-4 text-text-tertiary flex-shrink-0" />}
        <span className={`font-normal whitespace-nowrap ${labelClassName}`}>{label}</span>
      </div>
      <span className={`text-right min-w-0 ${valueClassName}`}>{renderValue()}</span>
    </div>
  );
};
