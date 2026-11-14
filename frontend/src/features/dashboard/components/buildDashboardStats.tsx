/**
 * Builds dashboard stat cards based on user role and metrics.
 */

import { Icon } from '@/components/primitives';
import { formatCurrency } from '@/utils';
import { IconKeys } from '@/config/icons';
import type { DashboardStat } from './DashboardStatsGrid';
import { tCap } from '@/config/clientConfig';

export function buildDashboardStats({
  isReceptionRole,
  isLabRole,
  patientsCount,
  todayPatients,
  ordersCount,
  todayOrders,
  todayRevenue,
  pendingOrders,
}: {
  isReceptionRole: boolean;
  isLabRole: boolean;
  patientsCount: number;
  todayPatients: number;
  ordersCount: number;
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
}): DashboardStat[] {
  const patientsLabel = `Total ${tCap('patients', 'Patients')}`;
  const ordersLabel = `Total ${tCap('orders', 'Orders')}`;
  const activeOrdersLabel = `Active ${tCap('orders', 'Orders')}`;
  return [
    ...(isReceptionRole
      ? [
          {
            label: patientsLabel,
            value: patientsCount,
            today: todayPatients,
            icon: <Icon iconKey={IconKeys.ui.usersGroup} className="w-8 h-8 text-brand" />,
            color: 'bg-brand-muted',
          },
          {
            label: ordersLabel,
            value: ordersCount,
            today: todayOrders,
            icon: (
              <Icon iconKey={IconKeys.dataFields.document} className="w-8 h-8 text-pink-fg-emphasis" />
            ),
            color: 'bg-pink-bg-emphasis',
          },
          {
            label: 'Revenue Today',
            value: formatCurrency(todayRevenue),
            icon: <Icon iconKey={IconKeys.dataFields.dollarSign} className="w-8 h-8 text-warning-fg" />,
            color: 'bg-warning-bg',
          },
        ]
      : []),
    ...(isLabRole
      ? [
          {
            label: activeOrdersLabel,
            value: pendingOrders,
            icon: <Icon iconKey={IconKeys.dataFields.trendingUp} className="w-8 h-8 text-brand" />,
            color: 'bg-brand-muted',
          },
        ]
      : []),
  ];
}
