/**
 * Report Data Generator
 * Generates reports for orders with validated/reported tests
 */

import { faker } from '@faker-js/faker';
import { generateReportId } from '../utils/id-generator';
import { pickOne, weightedRandom, chance } from '../utils/probability';
import { addHours, toISOString } from '../utils/date-utils';

// Types (matching src/types/report.ts)
type ReportStatus = 'generated' | 'sent' | 'delivered' | 'viewed';
type DeliveryMethod = 'print' | 'email' | 'portal' | 'download';

interface LabReport {
  reportId: string;
  orderId: string;
  patientId: string;
  patientName: string;
  reportedAt: string;
  generatedBy: string;
  validatedBy: string;
  status: ReportStatus;
  deliveryMethods: DeliveryMethod[];
  deliveredAt?: string;
  viewedAt?: string;
}

// Order type (simplified)
interface Order {
  orderId: string;
  patientId: string;
  orderDate: string;
  overallStatus: string;
  tests: Array<{
    testCode: string;
    status: string;
    validatedBy?: string;
    resultValidatedAt?: string;
  }>;
}

// Patient type (simplified)
interface Patient {
  id: string;
  fullName: string;
}

// Staff IDs
const STAFF_IDS = ['USR-001', 'USR-002', 'USR-003'];
const VALIDATOR_IDS = ['USR-001', 'USR-002'];

/**
 * Check if order qualifies for a report (all tests validated or reported)
 */
function orderQualifiesForReport(order: Order): boolean {
  const validatedStatuses = ['validated', 'reported'];
  return order.tests.every(t => validatedStatuses.includes(t.status));
}

/**
 * Generate report for an order
 */
function generateReportForOrder(
  order: Order,
  patient: Patient
): LabReport {
  // Find the latest validation time from tests
  const validationTimes = order.tests
    .filter(t => t.resultValidatedAt)
    .map(t => new Date(t.resultValidatedAt!));

  const latestValidation = validationTimes.length > 0
    ? new Date(Math.max(...validationTimes.map(d => d.getTime())))
    : new Date(order.orderDate);

  const reportDate = addHours(latestValidation, faker.number.int({ min: 1, max: 4 }));

  // Determine report status based on order status
  let status: ReportStatus;
  if (order.overallStatus === 'delivered') {
    status = weightedRandom<ReportStatus>([
      ['delivered', 50],
      ['viewed', 30],
      ['sent', 20],
    ]);
  } else {
    status = weightedRandom<ReportStatus>([
      ['generated', 60],
      ['sent', 40],
    ]);
  }

  // Select delivery methods
  const deliveryMethods: DeliveryMethod[] = [];
  const availableMethods: DeliveryMethod[] = ['print', 'email', 'portal', 'download'];

  // Always at least one method
  deliveryMethods.push(pickOne(availableMethods));

  // Possibly add more methods
  if (chance(40)) {
    const remaining = availableMethods.filter(m => !deliveryMethods.includes(m));
    if (remaining.length > 0) {
      deliveryMethods.push(pickOne(remaining));
    }
  }

  // Get validator from test or default
  const testValidator = order.tests.find(t => t.validatedBy)?.validatedBy;
  const validatedBy = testValidator || pickOne(VALIDATOR_IDS);

  const report: LabReport = {
    reportId: generateReportId(reportDate),
    orderId: order.orderId,
    patientId: order.patientId,
    patientName: patient.fullName,
    reportedAt: toISOString(reportDate),
    generatedBy: pickOne(STAFF_IDS),
    validatedBy,
    status,
    deliveryMethods,
  };

  // Add delivered/viewed times for appropriate statuses
  if (status === 'delivered' || status === 'viewed' || status === 'sent') {
    report.deliveredAt = toISOString(addHours(reportDate, faker.number.int({ min: 1, max: 24 })));
  }

  if (status === 'viewed') {
    report.viewedAt = toISOString(addHours(new Date(report.deliveredAt!), faker.number.int({ min: 1, max: 48 })));
  }

  return report;
}

/**
 * Generate all reports for qualifying orders
 */
export function generateReports(
  orders: Order[],
  patients: Patient[]
): LabReport[] {
  console.log(`\n📄 Generating reports for qualifying orders...`);

  // Create patient map for quick lookup
  const patientMap = new Map<string, Patient>();
  for (const patient of patients) {
    patientMap.set(patient.id, patient);
  }

  const reports: LabReport[] = [];

  // Filter orders that qualify for reports
  const qualifyingOrders = orders.filter(orderQualifiesForReport);

  console.log(`   Found ${qualifyingOrders.length} orders with all tests validated/reported`);

  for (const order of qualifyingOrders) {
    const patient = patientMap.get(order.patientId);
    if (!patient) {
      console.warn(`   Warning: Patient ${order.patientId} not found for order ${order.orderId}`);
      continue;
    }

    const report = generateReportForOrder(order, patient);
    reports.push(report);
  }

  // Log statistics
  const stats = {
    total: reports.length,
    byStatus: {
      generated: reports.filter(r => r.status === 'generated').length,
      sent: reports.filter(r => r.status === 'sent').length,
      delivered: reports.filter(r => r.status === 'delivered').length,
      viewed: reports.filter(r => r.status === 'viewed').length,
    },
    deliveryMethods: {} as Record<string, number>,
  };

  for (const report of reports) {
    for (const method of report.deliveryMethods) {
      stats.deliveryMethods[method] = (stats.deliveryMethods[method] || 0) + 1;
    }
  }

  console.log('📊 Report Statistics:');
  console.log(`   Total: ${stats.total}`);
  console.log(`   By Status: Generated=${stats.byStatus.generated}, Sent=${stats.byStatus.sent}, Delivered=${stats.byStatus.delivered}, Viewed=${stats.byStatus.viewed}`);
  console.log(`   Delivery Methods: ${Object.entries(stats.deliveryMethods).map(([k, v]) => `${k}=${v}`).join(', ')}`);

  return reports;
}
