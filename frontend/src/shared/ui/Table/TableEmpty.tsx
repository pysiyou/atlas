import { Icon, type IconName } from '../display/Icon';
import { ICONS } from '@/utils';

interface TableEmptyProps {
  message?: React.ReactNode;
  icon?: string;
}

/**
 * Table Empty Component
 * Displays empty state when no data is available
 */
export function TableEmpty({ message = 'No data available', icon = ICONS.dataFields.document }: TableEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      {icon && <Icon name={icon as IconName} className="w-12 h-12 text-text-disabled mb-3" />}
      <p className="text-sm text-text-tertiary">{message}</p>
    </div>
  );
}
