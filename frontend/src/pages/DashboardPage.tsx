/**
 * Dashboard Page
 * Main dashboard view showing overview statistics
 */

import React from 'react';
import { useAuth } from '@/hooks';
import { Card, SectionContainer, Badge, Icon } from '@/shared/ui';
import { usePatients } from '@/hooks';
import { useOrders } from '@/features/order/OrderContext';
import { useAppointments } from '@/features/appointment/AppointmentsContext';
import { useBilling } from '@/features/billing/BillingContext';
import { formatCurrency, formatDate } from '@/utils';
import { getPatientName } from '@/utils/typeHelpers';

export const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { patients } = usePatients();
  const { orders } = useOrders();
  const { appointments } = useAppointments();
  const { invoices, payments } = useBilling();
  
  const today = new Date().toISOString().split('T')[0];
  const todayPatients = patients.filter(p => p.registrationDate.startsWith(today)).length;
  const todayOrders = orders.filter(o => o.orderDate.startsWith(today)).length;
  const todayAppointments = appointments.filter(a => a.date === today).length;
  const todayRevenue = payments.filter(p => p.paidAt && p.paidAt.startsWith(today)).reduce((sum, p) => sum + p.amount, 0);
  
  const pendingOrders = orders.filter(o => o.overallStatus === 'ordered' || o.overallStatus === 'in-progress').length;
  const outstandingInvoices = invoices.filter(i => i.paymentStatus !== 'paid').length;
  
  const stats = [
    {
      label: 'Total Patients',
      value: patients.length,
      today: todayPatients,
      icon: <Icon name="users-group" className="w-8 h-8 text-sky-600" />,
      color: 'bg-sky-50',
    },
    {
      label: 'Total Orders',
      value: orders.length,
      today: todayOrders,
      icon: <Icon name="document" className="w-8 h-8 text-green-600" />,
      color: 'bg-green-50',
    },
    {
      label: 'Appointments Today',
      value: todayAppointments,
      icon: <Icon name="calendar" className="w-8 h-8 text-purple-600" />,
      color: 'bg-purple-50',
    },
    {
      label: 'Revenue Today',
      value: formatCurrency(todayRevenue),
      icon: <Icon name="dollar-sign" className="w-8 h-8 text-orange-600" />,
      color: 'bg-orange-50',
    },
  ];
  
  const recentOrders = orders.slice(-5).reverse();
  
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {currentUser?.name}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening today - {formatDate(new Date())}
        </p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <div className={`p-3 rounded ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Alerts */}
      {pendingOrders > 0 && (
        <Card padding="md">
          <div className="flex items-center gap-3">
            <Icon name="trending-up" className="w-6 h-6 text-yellow-600" />
            <div>
              <p className="font-medium text-gray-900">Pending Actions</p>
              <p className="text-sm text-gray-600">
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
            recentOrders.map((order) => (
              <div
                key={order.orderId}
                className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-gray-900">{getPatientName(order.patientId, patients)}</p>
                  <p className="text-sm text-gray-500">{order.orderId} • {order.tests.length} test(s)</p>
                </div>
                <Badge variant={
                  order.overallStatus === 'completed' ? 'success' :
                  order.overallStatus === 'in-progress' ? 'warning' :
                  'info'
                } size="sm" className="border-none font-medium">
                  {order.overallStatus}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">No recent orders</p>
          )}
        </div>
      </SectionContainer>
      </div>
    </div>
  );
};
