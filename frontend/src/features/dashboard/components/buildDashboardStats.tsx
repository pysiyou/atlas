/**
 * Builds dashboard stat cards based on user role and metrics.
 */

import { Icon } from '@/components';
import { formatCurrency } from '@/utils';
import { ICONS } from '@/config/icons';
import type { DashboardStat } from './DashboardStatsGrid';

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
  return [
    ...(isReceptionRole
      ? [
          {
            label: 'Total Patients',
            value: patientsCount,
            today: todayPatients,
            icon: <Icon name={ICONS.ui.usersGroup} className="w-8 h-8 text-brand" />,
            color: 'bg-brand-muted',
          },
          {
            label: 'Total Orders',
            value: ordersCount,
            today: todayOrders,
            icon: <Icon name={ICONS.dataFields.document} className="w-8 h-8 text-success-fg" />,
            color: 'bg-success-bg',
          },
          {
            label: 'Revenue Today',
            value: formatCurrency(todayRevenue),
            icon: <Icon name={ICONS.dataFields.dollarSign} className="w-8 h-8 text-warning-fg" />,
            color: 'bg-warning-bg',
          },
        ]
      : []),
    ...(isLabRole
      ? [
          {
            label: 'Active Orders',
            value: pendingOrders,
            icon: <Icon name={ICONS.dataFields.trendingUp} className="w-8 h-8 text-brand" />,
            color: 'bg-brand-muted',
          },
        ]
      : []),
  ];
}
