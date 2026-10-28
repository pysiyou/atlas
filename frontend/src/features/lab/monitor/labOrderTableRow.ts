/**
 * Map worklist API rows to lab monitor table rows.
 */
import type { DashboardWorklistItem } from '../api/worklists';
import type { LabOrderTableRow } from './LabOrdersTable';

export function mapDashboardWorklistRow(item: DashboardWorklistItem): LabOrderTableRow {
  return {
    id: `test-${item.orderTestId}`,
    stage: item.stage,
    testCode: item.testCode,
    testName: item.testName,
    patientName: item.patientName,
    patientId: item.patientId,
    patientDob: item.patientDob,
    patientGender: item.patientGender,
    referentDoctorName: item.referentDoctorName ?? null,
    referentDoctorHospital: item.referentDoctorHospital ?? null,
    department: item.testCategory ?? null,
    sampleType: item.sampleType,
    priority: item.priority,
    status: item.status,
    date: item.activityAt,
    orderId: item.orderId,
    orderTestId: item.orderTestId,
    statusPresentation: item.statusPresentation ?? null,
  };
}
