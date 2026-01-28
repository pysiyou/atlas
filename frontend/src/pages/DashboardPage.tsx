/**
 * Dashboard Page
 * Main dashboard view showing overview statistics
 */

import React from 'react';
import { useAuthStore } from '@/shared/stores/auth.store';
import {
  usePatientsList,
  useOrdersList,
  usePaymentsList,
  usePatientNameLookup,
} from '@/hooks/queries';
import { Card, SectionContainer, Badge, Icon } from '@/shared/ui';
import { formatCurrency, formatDate } from '@/utils';
import { displayId } from '@/utils';
import { ICONS } from '@/utils';

export const Dashboard: React.FC = () => {
  const { user: currentUser } = useAuthStore();
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
      icon: <Icon name={ICONS.ui.usersGroup} className="w-8 h-8 text-brand" />,
      color: 'bg-brand/10',
    },
    {
      label: 'Total Orders',
      value: orders.length,
      today: todayOrders,
      icon: <Icon name={ICONS.dataFields.document} className="w-8 h-8 text-success" />,
      color: 'bg-success/10',
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
      icon: <Icon name={ICONS.dataFields.dollarSign} className="w-8 h-8 text-warning" />,
      color: 'bg-warning/10',
    },
  ];

  const recentOrders = orders.slice(-5).reverse();

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Welcome back, {currentUser?.name}!</h1>
          <p className="text-sm text-text-secondary mt-1">
            Here's what's happening today - {formatDate(new Date())}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} padding="lg" hover>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-text-tertiary mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-text-primary">{stat.value}</p>
                  {stat.today !== undefined && (
                    <p className="text-xs text-success mt-1">+{stat.today} today</p>
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
              <Icon name={ICONS.dataFields.trendingUp} className="w-6 h-6 text-warning" />
              <div>
                <p className="text-sm font-semibold text-text-primary">Pending Actions</p>
                <p className="text-xs text-text-secondary">
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
                  className="flex items-center justify-between p-4 border border-border rounded-md hover:bg-app-bg"
                >
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{getPatientName(order.patientId)}</p>
                    <p className="text-xs text-text-tertiary">
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
              <p className="text-center text-sm text-text-tertiary py-8">No recent orders</p>
            )}
          </div>
        </SectionContainer>
      </div>
    </div>
  );
};
