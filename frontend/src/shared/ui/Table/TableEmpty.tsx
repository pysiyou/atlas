import { Icon } from '../Icon';
import type { IconName } from '../Icon';

interface TableEmptyProps {
  message?: React.ReactNode;
  icon?: string;
}

/**
 * Table Empty Component
 * Displays empty state when no data is available
 */
export function TableEmpty({
  message = 'No data available',
  icon = 'inbox',
}: TableEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <Icon
          name={icon as IconName}
          className="w-12 h-12 text-gray-400 mb-4"
        />
      )}
      <p className="text-gray-500 text-sm">
        {message}
      </p>
    </div>
  );
}
