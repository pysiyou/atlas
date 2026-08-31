/**
 * Banner shown when orders are in progress for reception roles.
 */

import React from 'react';
import { Card, Icon } from '@/components';
import { ICONS } from '@/config/icons';

export interface DashboardOrdersInProgressBannerProps {
  pendingOrders: number;
}

export const DashboardOrdersInProgressBanner: React.FC<DashboardOrdersInProgressBannerProps> = ({
  pendingOrders,
}) => (
  <Card padding="md">
    <div className="flex items-center gap-3">
      <Icon name={ICONS.dataFields.trendingUp} className="w-6 h-6 text-warning-fg" />
      <div>
        <p className="text-sm font-normal text-text-primary">Orders In Progress</p>
        <p className="text-xs text-text-secondary">
          {pendingOrders} order{pendingOrders !== 1 ? 's' : ''} awaiting completion
        </p>
      </div>
    </div>
  </Card>
);
