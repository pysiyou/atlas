/**
 * Dashboard Page
 * Reception/admin overview with real metrics (no stub data).
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/app/store';
import { usePatientNameLookup, usePatientsList } from '@/features/patients/api/usePatients';
import { useOrdersList } from '@/features/orders/api/useOrderQueries';
import { usePaymentsList } from '@/features/billing/api/usePayments';
import { Card, SectionContainer, Badge, Icon } from '@/components';
import { formatCurrency, formatDate } from '@/utils';
import { displayId } from '@/utils';
import { ICONS } from '@/utils';
import { ROUTES } from '@/config';
import { LabPipelineSummary } from './components/LabPipelineSummary';
import { CriticalValuesPanel } from '@/features/critical-values/components/CriticalValuesPanel';

export const Dashboard: React.FC = () => {
  const { user: currentUser, hasRole } = useAuthStore();
  const { patients } = usePatientsList();
  const { orders } = useOrdersList();
  const { payments } = usePaymentsList();
  const { getPatientName } = usePatientNameLookup();

  const isLabRole = hasRole(['administrator', 'lab-technician', 'lab-technician-plus']);
  const isReceptionRole = hasRole(['administrator', 'receptionist']);

  const today = new Date().toISOString().split('T')[0];
  const todayPatients = patients.filter(p => p.registrationDate.startsWith(today)).length;
  const todayOrders = orders.filter(o => o.orderDate.startsWith(today)).length;
  const todayRevenue = payments
    .filter(p => p.paidAt && p.paidAt.startsWith(today))
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingOrders = orders.filter(
    o => o.overallStatus === 'ordered' || o.overallStatus === 'in-progress'
  ).length;

  const stats = [
    ...(isReceptionRole
      ? [
          {
            label: 'Total Patients',
            value: patients.length,
            today: todayPatients,
            icon: <Icon name={ICONS.ui.usersGroup} className="w-8 h-8 text-brand" />,
            color: 'bg-brand-muted',
          },
          {
            label: 'Total Orders',
            value: orders.length,
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

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-full flex flex-col p-2 gap-2">
      <div className="shrink-0 h-14 min-h-14 max-h-14 flex flex-col justify-center">
        <h1 className="text-xl font-bold text-text-primary truncate">
          Welcome back, {currentUser?.name}!
        </h1>
        <p className="text-sm text-text-secondary truncate">
          Here&apos;s what&apos;s happening today — {formatDate(new Date())}
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="space-y-6">
          {stats.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card key={index} padding="lg" hover>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-text-tertiary mb-1">{stat.label}</p>
                      <p className="text-3xl font-normal text-text-primary">{stat.value}</p>
                      {'today' in stat && stat.today !== undefined && (
                        <p className="text-xs text-success-fg mt-1">+{stat.today} today</p>
                      )}
                    </div>
                    <div className={`p-3 rounded ${stat.color}`}>{stat.icon}</div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {isLabRole && <LabPipelineSummary />}
          {isLabRole && <CriticalValuesPanel />}

          {pendingOrders > 0 && isReceptionRole && (
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
          )}

          {isReceptionRole && (
            <SectionContainer
              title="Recent Orders"
              headerRight={
                <Link to={ROUTES.ORDERS} className="text-xs text-brand hover:underline">
                  View all
                </Link>
              }
            >
              <div className="space-y-3">
                {recentOrders.length > 0 ? (
                  recentOrders.map(order => (
                    <Link
                      key={order.orderId}
                      to={`${ROUTES.ORDERS}/${order.orderId}`}
                      className="flex items-center justify-between p-4 border border-border-default rounded-md hover:bg-surface-page"
                    >
                      <div>
                        <p className="text-sm font-normal text-text-primary">
                          {getPatientName(order.patientId)}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          <span className="font-mono">{displayId.order(order.orderId)}</span> •{' '}
                          {order.tests.length} test(s)
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
                        className="border-none font-normal"
                      >
                        {order.overallStatus}
                      </Badge>
                    </Link>
                  ))
                ) : (
                  <p className="text-center text-sm text-text-tertiary py-8">No recent orders</p>
                )}
              </div>
            </SectionContainer>
          )}
        </div>
      </div>
    </div>
  );
};
