/**
 * Dashboard Page
 * Main dashboard view showing overview statistics
 */

import React from 'react';
import { useAuth } from '@/hooks';
import {
  usePatientsList,
  useOrdersList,
  usePaymentsList,
  usePatientNameLookup,
} from '@/hooks/queries';
import { Card, SectionContainer, Badge, Icon } from '@/shared/ui';
import { formatCurrency, formatDate } from '@/utils';
import { displayId } from '@/utils/id-display';
import { ICONS } from '@/utils/icon-mappings';
import { semanticColors, brandColors } from '@/shared/design-system/tokens/colors';
import { heading, body } from '@/shared/design-system/tokens/typography';
import { padding, gap } from '@/shared/design-system/tokens/spacing';
import { border, radius } from '@/shared/design-system/tokens/borders';

export const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { patients } = usePatientsList();
  const { orders } = useOrdersList();
  const { payments } = usePaymentsList();
  const { getPatientName } = usePatientNameLookup();

  // Stubbed until appointment/invoice APIs exist. TODO: Add hooks when available.
  const appointments: Array<{ date: string }> = [];
  const invoices: Array<{ paymentStatus: string }> = [];

  const today = new Date().toISOString().split('T')[0];
  const todayPatients = patients.filter(p => p.registrationDate.startsWith(today)).length;
  const todayOrders = orders.filter(o => o.orderDate.startsWith(today)).length;
  const todayAppointments = appointments.filter(a => a.date === today).length;
  const todayRevenue = payments
    .filter(p => p.paidAt && p.paidAt.startsWith(today))
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingOrders = orders.filter(
    o => o.overallStatus === 'ordered' || o.overallStatus === 'in-progress'
  ).length;
  const outstandingInvoices = invoices.filter(i => i.paymentStatus !== 'paid').length;

  const stats = [
    {
      label: 'Total Patients',
      value: patients.length,
      today: todayPatients,
      icon: <Icon name={ICONS.ui.usersGroup} className={`w-8 h-8 ${brandColors.primary.icon}`} />,
      color: brandColors.primary.backgroundLight,
    },
    {
      label: 'Total Orders',
      value: orders.length,
      today: todayOrders,
      icon: <Icon name={ICONS.dataFields.document} className={`w-8 h-8 ${semanticColors.success.icon}`} />,
      color: semanticColors.success.backgroundLight,
    },
    {
      label: 'Appointments Today',
      value: todayAppointments,
      icon: <Icon name={ICONS.dataFields.date} className="w-8 h-8 text-purple-600" />,
      color: 'bg-purple-50',
    },
    {
      label: 'Revenue Today',
      value: formatCurrency(todayRevenue),
      icon: <Icon name={ICONS.dataFields.dollarSign} className={`w-8 h-8 ${semanticColors.warning.icon}`} />,
      color: semanticColors.warning.backgroundLight,
    },
  ];

  const recentOrders = orders.slice(-5).reverse();

  return (
    <div className={`h-full overflow-y-auto ${padding.card.xl}`}>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className={`${heading.h1}`}>Welcome back, {currentUser?.name}!</h1>
          <p className={`${body.default} mt-1`}>
            Here's what's happening today - {formatDate(new Date())}
          </p>
        </div>

        {/* Stats Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 ${gap.lg}`}>
          {stats.map((stat, index) => (
            <Card key={index} padding="lg" hover>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  {stat.today !== undefined && (
                    <p className="text-sm text-green-600 mt-1">+{stat.today} today</p>
                  )}
                </div>
                <div className={`p-3 rounded ${stat.color}`}>{stat.icon}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Alerts */}
        {pendingOrders > 0 && (
          <Card padding="md">
            <div className="flex items-center gap-3">
              <Icon name={ICONS.dataFields.trendingUp} className={`w-6 h-6 ${semanticColors.warning.icon}`} />
              <div>
                <p className={`${body.default} ${heading.h5}`}>Pending Actions</p>
                <p className={body.small}>
                  {pendingOrders} orders pending completion, {outstandingInvoices} invoices unpaid
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Recent Activity */}
        <SectionContainer title="Recent Orders">
          <div className="space-y-3">
            {recentOrders.length > 0 ? (
              recentOrders.map(order => (
                <div
                  key={order.orderId}
                  className={`flex items-center justify-between ${padding.card.md} ${border.default} ${radius.md} hover:bg-gray-50`}
                >
                  <div>
                    <p className={`${body.default} ${heading.h5}`}>{getPatientName(order.patientId)}</p>
                    <p className={body.metadata}>
                      <span className="font-mono">{displayId.order(order.orderId)}</span> • {order.tests.length} test(s)
                    </p>
                  </div>
                  <Badge
                    variant={
                      order.overallStatus === 'completed'
                        ? 'success'
                        : order.overallStatus === 'in-progress'
                          ? 'warning'
                          : 'info'
                    }
                    size="sm"
                    className="border-none font-medium"
                  >
                    {order.overallStatus}
                  </Badge>
                </div>
              ))
            ) : (
              <p className={`text-center ${body.muted} ${padding.vertical.lg}`}>No recent orders</p>
            )}
          </div>
        </SectionContainer>
      </div>
    </div>
  );
};
