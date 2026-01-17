import React from 'react';
import { Icon } from '@/shared/ui/Icon';
import type { IconName } from '@/shared/ui/Icon';

interface EmptyStateProps {
  type?: 'search' | 'no-results' | 'no-tests' | 'no-samples' | 'no-validation';
  searchQuery?: string;
  message?: string;
}

const EmptyStateConfig: Record<string, { iconName: IconName; message: (query: string) => string }> = {
  search: {
    iconName: 'search',
    message: (query: string) => `No tests found matching "${query}"`,
  },
  'no-results': {
    iconName: 'notebook',
    message: () => 'No samples awaiting results',
  },
  'no-tests': {
    iconName: 'notebook',
    message: () => 'No tests available',
  },
  'no-samples': {
    iconName: 'pour',
    message: () => 'No samples awaiting collection',
  },
  'no-validation': {
    iconName: 'shield-check',
    message: () => 'No results pending validation',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'no-results',
  searchQuery = '',
  message,
}) => {
  const config = EmptyStateConfig[type];
  const displayMessage = message || config.message(searchQuery);

  return (
    <div className="text-center py-12 text-gray-500">
      <Icon name={config.iconName} size={48} className="mx-auto mb-3 opacity-50" />
      <p>{displayMessage}</p>
    </div>
  );
};
