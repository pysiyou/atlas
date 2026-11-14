/**
 * Terminology-aware UI copy: page titles, table headers, and filter chips.
 */

import { tCap, tLower } from './clientConfig';

/** Titles and primary actions for module list pages */
export function getModuleListTitles() {
  const patient = tCap('patient', 'Patient');
  const patients = tCap('patients', 'Patients');
  const order = tCap('order', 'Order');
  const orders = tCap('orders', 'Orders');
  const reports = tCap('reports', 'Reports');
  const test = tCap('test', 'Test');

  return {
    patients,
    newPatient: `New ${patient}`,
    patientDetail: patient,
    orders,
    newOrder: `New ${order}`,
    orderDetail: order,
    payments: 'Payments',
    reports,
    reportsSubtitle: (count: number) =>
      `${count} ${tLower(count === 1 ? 'report' : 'reports', count === 1 ? 'report' : 'reports')}(s) available`,
    catalog: `${test} Catalog`,
    testDetail: test,
    editPatient: `Edit ${patient}`,
    newPatientModal: `New ${patient}`,
    editOrder: `Edit ${order}`,
    newOrderModal: `New ${order}`,
    relatedOrders: `Related ${orders}`,
    patientInformation: `${patient} Information`,
    viewPatient: `View ${patient}`,
    addOrder: `Add ${order}`,
    orderInformation: `${order} Information`,
    orderActivity: `${order} activity`,
    testsPanel: tCap('tests', 'Tests'),
  };
}

export function getOrderTableColumnHeaders() {
  return {
    orderId: tCap('order', 'Order'),
    patientName: tCap('patient', 'Patient'),
    tests: tCap('tests', 'Tests'),
    orderDate: 'Date',
    overallStatus: 'Status',
    priority: 'Priority',
    paymentStatus: 'Payment',
    totalPrice: 'Total',
  } as const;
}

export type OrderTableColumnHeaders = ReturnType<typeof getOrderTableColumnHeaders>;

export function getPatientTableColumnHeaders() {
  const patient = tCap('patient', 'Patient');
  const patients = tCap('patients', 'Patients');
  return {
    patientId: `${patient} ID`,
    orders: tCap('orders', 'Orders'),
    filterTitle: `${patient} Filters`,
    searchLabel: `Search ${patients}`,
    footerLabel: patients,
  } as const;
}

export function getUrlFilterChipLabels(): Record<string, string> {
  return {
    patientId: tCap('patient', 'Patient'),
    orderId: tCap('order', 'Order'),
    sampleId: tCap('sample', 'Sample'),
    testId: tCap('test', 'Test'),
  };
}