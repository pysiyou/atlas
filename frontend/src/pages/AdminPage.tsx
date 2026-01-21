/**
 * Admin Page
 * Administration and system settings
 */

import React from 'react';
import { usePatients } from '@/hooks';
import { useOrders } from '@/features/order/OrderContext';
import { useTests } from '@/features/test/TestsContext';
import { useBilling } from '@/features/billing/BillingContext';
import { Card, SectionContainer, Table, Icon } from '@/shared/ui';
import { formatCurrency } from '@/utils';
import type { Test } from '@/types';

export const Admin: React.FC = () => {
  const patientsContext = usePatients();
  const ordersContext = useOrders();
  const testsContext = useTests();
  const billingContext = useBilling();
  
  if (!patientsContext || !ordersContext || !testsContext || !billingContext) {
    return <div>Loading...</div>;
  }
  
  const { patients } = patientsContext;
  const { orders } = ordersContext;
  const { tests } = testsContext;
  const { getTotalRevenue } = billingContext;
  
  const stats = [
    { label: 'Total Patients', value: patients.length, icon: <Icon name="users-group" className="w-6 h-6" />, color: 'sky' },
    { label: 'Total Orders', value: orders.length, icon: <Icon name="document" className="w-6 h-6" />, color: 'green' },
    { label: 'Active Tests', value: tests.filter(t => t.isActive).length, icon: <Icon name="flask" className="w-6 h-6" />, color: 'purple' },
    { label: 'Total Revenue', value: formatCurrency(getTotalRevenue()), icon: <Icon name="dollar-sign" className="w-6 h-6" />, color: 'orange' },
  ];
  
  const testColumns = [
    { key: 'code', header: 'Code' },
    { key: 'name', header: 'Test Name' },
    { key: 'category', header: 'Category', render: (test: Test) => test.category.toUpperCase() },
    { key: 'price', header: 'Price', render: (test: Test) => formatCurrency(test.price) },
    { key: 'turnaroundTime', header: 'TAT (hrs)', render: (test: Test) => `${test.turnaroundTime}h` },
  ];
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
      
      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <Card key={idx}>
            <div className="flex items-start gap-3">
              <div className={`p-3 bg-${stat.color}-50 rounded text-${stat.color}-600`}>
                {stat.icon}
              </div>
              <div>
                <div className="text-sm text-gray-600">{stat.label}</div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Test Catalog */}
      <SectionContainer title="Test Catalog">
        <div className="text-sm text-gray-500 mb-3">{tests.length} total tests</div>
        <Table
          data={tests.filter(t => t.isActive).slice(0, 10)}
          columns={testColumns}
          emptyMessage="No tests available"
        />
        {tests.length > 10 && (
          <div className="text-center py-3 text-sm text-gray-500">
            Showing 10 of {tests.length} tests
          </div>
        )}
      </SectionContainer>
    </div>
  );
};
