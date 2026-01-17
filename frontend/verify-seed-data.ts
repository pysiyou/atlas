/**
 * Quick seed data verification script
 */

import { demoUsers } from './src/utils/seedData/users';
import { demoPatients } from './src/utils/seedData/patients';
import { testCatalog } from './src/utils/seedData/tests';
import { demoOrders } from './src/utils/seedData/orders';
import { demoAppointments } from './src/utils/seedData/appointments';
import { demoInvoices } from './src/utils/seedData/invoices';
import { demoPayments } from './src/utils/seedData/payments';
import { demoSamples } from './src/utils/seedData/samples';
import { verifySeedData, printVerificationResults } from './src/utils/verifySeedData';

console.log('🔍 Running seed data verification...\n');

const result = verifySeedData(
  demoUsers,
  demoPatients,
  testCatalog,
  demoOrders,
  demoAppointments,
  demoInvoices,
  demoPayments,
  demoSamples
);

printVerificationResults(result);

process.exit(result.isValid ? 0 : 1);
