/**
 * Admin Page
 * System administration: users, integrations, and catalog overview.
 */

import React, { useMemo } from 'react';
import { useTestCatalog } from '@/features/catalog/api/useTestCatalog';
import { usePatientsList } from '@/features/patients/api/usePatients';
import { useOrdersList } from '@/features/orders/api/useOrderQueries';
import { Card, SectionContainer, Table, Icon, type ColumnConfig } from '@/components';
import { AdminPageSkeleton } from './AdminPageSkeleton';
import { DATA_AMOUNT, DATA_ID_PRIMARY } from '@/utils/constants';
import { formatCurrency } from '@/utils';
import type { Test } from '@/types';
import { ICONS } from '@/utils';
import { UserManagementSection } from './components/UserManagementSection';
import { AnalyzerStatusPanel } from './components/AnalyzerStatusPanel';

const getAdminTestTableColumns = (): ColumnConfig<Test>[] => [
  {
    key: 'code',
    header: 'Code',
    width: 'sm',
    sortable: true,
    render: (test: Test) => <span className={DATA_ID_PRIMARY}>{test.code}</span>,
  },
  {
    key: 'name',
    header: 'Test Name',
    width: 'fill',
    sortable: true,
    render: (test: Test) => (
      <div className="font-normal text-text-primary truncate">{test.name}</div>
    ),
  },
  {
    key: 'category',
    header: 'Category',
    width: 'md',
    sortable: true,
    render: (test: Test) => (
      <span className="text-xs text-text-tertiary uppercase truncate block">{test.category}</span>
    ),
  },
  {
    key: 'price',
    header: 'Price',
    width: 'sm',
    align: 'right',
    sortable: true,
    render: (test: Test) => (
      <div className={`${DATA_AMOUNT} truncate`}>{formatCurrency(test.price)}</div>
    ),
  },
];

const AdminTestTable: React.FC<{ tests: Test[] }> = ({ tests }) => {
  const columns = useMemo(() => getAdminTestTableColumns(), []);

  const viewConfig = useMemo(
    () => ({
      fullColumns: columns,
      mediumColumns: columns,
      compactColumns: columns.slice(0, 3),
      CardComponent: ({ item }: { item: Test }) => (
        <div className="p-3 border rounded">
          <div className="font-normal">{item.name}</div>
          <div className="text-xs text-text-tertiary">{item.code}</div>
        </div>
      ),
    }),
    [columns]
  );

  return (
    <Table<Test>
      data={tests}
      viewConfig={viewConfig}
      striped
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
    return <AdminPageSkeleton />;
  }

  const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

  const stats = [
    {
      label: 'Total Patients',
      value: patients.length,
      icon: <Icon name={ICONS.ui.usersGroup} className="w-6 h-6" />,
    },
    {
      label: 'Total Orders',
      value: orders.length,
      icon: <Icon name={ICONS.dataFields.document} className="w-6 h-6" />,
    },
    {
      label: 'Active Tests',
      value: tests.filter(t => t.isActive).length,
      icon: <Icon name={ICONS.dataFields.flask} className="w-6 h-6" />,
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      icon: <Icon name={ICONS.dataFields.dollarSign} className="w-6 h-6" />,
    },
  ];

  return (
    <div className="space-y-6 p-2">
      <h1 className="text-2xl font-bold text-text-primary">Administration</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <Card key={idx} padding="md">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-brand-muted rounded text-brand">{stat.icon}</div>
              <div>
                <div className="text-sm text-text-tertiary">{stat.label}</div>
                <div className="text-2xl font-normal text-text-primary">{stat.value}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <UserManagementSection />
      <AnalyzerStatusPanel />

      <SectionContainer title="Test Catalog">
        <div className="text-sm text-text-tertiary mb-3">{tests.length} total tests</div>
        <AdminTestTable tests={tests.filter(t => t.isActive).slice(0, 10)} />
        {tests.length > 10 && (
          <div className="text-center py-3 text-sm text-text-tertiary">
            Showing 10 of {tests.length} tests
          </div>
        )}
      </SectionContainer>
    </div>
  );
};
