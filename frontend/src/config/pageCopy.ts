/**
 * List and detail page titles with client terminology.
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