import { Icon, type IconName } from '../Icon';
import { ICONS } from '@/utils/icon-mappings';
import { tableEmpty } from '@/shared/design-system/tokens/components/table';

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
    <div className={tableEmpty.container}>
      {icon && <Icon name={icon as IconName} className={tableEmpty.icon} />}
      <p className={tableEmpty.message}>{message}</p>
    </div>
  );
}
