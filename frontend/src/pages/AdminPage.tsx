/**
 * Admin Page
 * Administration and system settings
 */

import React from 'react';
import { usePatients } from '@/hooks';
import { useOrders } from '@/features/order/OrderContext';
import { useTests } from '@/features/test/useTests';
import { useBilling } from '@/features/billing/useBilling';
import { Card, SectionContainer, Table } from '@/shared/ui';
import { formatCurrency } from '@/utils';
import { Users, FileText, Beaker, DollarSign } from 'lucide-react';
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
    { label: 'Total Patients', value: patients.length, icon: <Users />, color: 'sky' },
    { label: 'Total Orders', value: orders.length, icon: <FileText />, color: 'green' },
    { label: 'Active Tests', value: tests.filter(t => t.isActive).length, icon: <Beaker />, color: 'purple' },
    { label: 'Total Revenue', value: formatCurrency(getTotalRevenue()), icon: <DollarSign />, color: 'orange' },
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
