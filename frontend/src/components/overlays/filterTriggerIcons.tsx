/**
 * Shared leading icon for filter / search triggers.
 */

import { Icon } from '@/components/primitives/Icon';
import { IconKeys } from '@/config/icons';

/** Leading search icon for filter dropdown triggers. */
export const filterInputIcon = (
  <Icon iconKey={IconKeys.actions.search}
    className="w-4 h-4 text-text-muted group-hover:text-brand shrink-0 transition-colors"
  />
);
