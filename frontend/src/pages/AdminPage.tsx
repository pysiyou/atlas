/**
 * Admin Page
 * Administration and system settings
 */

import React, { useMemo } from 'react';
import { usePatientsList, useOrdersList, useTestCatalog } from '@/hooks/queries';
import { Card, SectionContainer, Table, Icon, type ColumnConfig } from '@/shared/ui';
import { formatCurrency } from '@/utils';
import type { Test } from '@/types';
import { ICONS } from '@/utils/icon-mappings';
import { semanticColors } from '@/shared/design-system/tokens/colors';

/**
 * Admin Test Table Columns
 * Simple column definition for admin page test overview
 */
const getAdminTestTableColumns = (): ColumnConfig<Test>[] => [
  {
    key: 'code',
    header: 'Code',
    width: 'sm',
    sortable: true,
    render: (test: Test) => (
      <span className={`text-xs ${semanticColors.info.icon} font-medium font-mono truncate block`}>{test.code}</span>
    ),
  },
  {
    key: 'name',
    header: 'Test Name',
    width: 'fill',
    sortable: true,
    render: (test: Test) => <div className="font-medium text-gray-900 truncate">{test.name}</div>,
  },
  {
    key: 'category',
    header: 'Category',
    width: 'md',
    sortable: true,
    render: (test: Test) => (
      <span className="text-xs text-gray-600 uppercase truncate block">{test.category}</span>
    ),
  },
  {
    key: 'price',
    header: 'Price',
    width: 'sm',
    align: 'right',
    sortable: true,
    render: (test: Test) => (
      <div className={`font-medium ${semanticColors.info.icon} truncate`}>{formatCurrency(test.price)}</div>
    ),
  },
  {
    key: 'turnaroundTime',
    header: 'TAT (hrs)',
    width: 'sm',
    sortable: true,
    render: (test: Test) => (
      <div className="text-xs text-gray-500 truncate">{test.turnaroundTime}h</div>
    ),
  },
];

/**
 * Admin Test Table Component
 * Displays a simple table of active tests
 */
const AdminTestTable: React.FC<{ tests: Test[] }> = ({ tests }) => {
  const columns = useMemo(() => getAdminTestTableColumns(), []);

  // Create a simple viewConfig for the Table component
  const viewConfig = useMemo(
    () => ({
      fullColumns: columns,
      mediumColumns: columns,
      compactColumns: columns.slice(0, 3), // Code, Name, Category
      CardComponent: ({ item }: { item: Test }) => (
        <div className="p-3 border rounded">
          <div className="font-medium">{item.name}</div>
          <div className="text-xs text-gray-500">{item.code}</div>
        </div>
      ),
    }),
    [columns]
  );

  return (
    <Table<Test>
      data={tests}
      viewConfig={viewConfig}
      emptyMessage="No tests available"
      pagination={false}
    />
  );
};

export const Admin: React.FC = () => {
  const { patients, isLoading: patientsLoading } = usePatientsList();
  const { orders, isLoading: ordersLoading } = useOrdersList();
  const { tests, isLoading: testsLoading } = useTestCatalog();

  if (patientsLoading || ordersLoading || testsLoading) {
    return <div>Loading...</div>;
  }

  // Calculate total revenue from orders (billing context removed)
  const getTotalRevenue = () => {
    return orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  };

  const stats = [
    {
      label: 'Total Patients',
      value: patients.length,
      icon: <Icon name={ICONS.ui.usersGroup} className="w-6 h-6" />,
      color: 'sky',
    },
    {
      label: 'Total Orders',
      value: orders.length,
      icon: <Icon name={ICONS.dataFields.document} className="w-6 h-6" />,
      color: 'green',
    },
    {
      label: 'Active Tests',
      value: tests.filter(t => t.isActive).length,
      icon: <Icon name={ICONS.dataFields.flask} className="w-6 h-6" />,
      color: 'purple',
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(getTotalRevenue()),
      icon: <Icon name={ICONS.dataFields.dollarSign} className="w-6 h-6" />,
      color: 'orange',
    },
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
        <AdminTestTable tests={tests.filter(t => t.isActive).slice(0, 10)} />
        {tests.length > 10 && (
          <div className="text-center py-3 text-sm text-gray-500">
            Showing 10 of {tests.length} tests
          </div>
        )}
      </SectionContainer>
    </div>
  );
};
