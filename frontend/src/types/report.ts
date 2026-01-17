/**
 * Report Generation Types
 */

export type ReportStatus = 'generated' | 'sent' | 'delivered' | 'viewed';

export type DeliveryMethod = 'print' | 'email' | 'portal' | 'download';

export interface LabReport {
  reportId: string; // REP-YYYYMMDD-XXX
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
  pdfBlob?: Blob;
}
