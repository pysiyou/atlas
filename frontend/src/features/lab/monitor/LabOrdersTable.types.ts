/**
 * Row shape for lab order test tables (monitor + all-tests registry).
 */
import type { LabPipelineStage } from './monitorModel';
import type { Gender, PriorityLevel, TestStatus } from '@/types';
import type { StatusPresentation } from '@/lib/api/types';

export interface LabOrderTableRow {
  id: string;
  stage: LabPipelineStage;
  testCode: string;
  testName: string;
  patientName: string;
  patientId: string;
  patientDob: string;
  patientGender: Gender;
  referentDoctorName: string | null;
  referentDoctorHospital: string | null;
  department: string | null;
  sampleType: string;
  priority: PriorityLevel;
  status: TestStatus;
  date: string;
  orderId: string;
  orderTestId: number;
  statusPresentation?: StatusPresentation | null;
}
