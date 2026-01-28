/**
 * Reports Page
 * Report generation and management with PDF support
 */

import React, { useState } from 'react';
import {
  useOrdersList,
  usePatientsList,
  useTestCatalog,
  usePatientNameLookup,
  useTestNameLookup,
} from '@/hooks/queries';
import { SectionContainer, Badge, Button, EmptyState, Icon } from '@/shared/ui';
import { formatDate } from '@/utils';
import { displayId } from '@/utils';
import toast from 'react-hot-toast';
import { ICONS } from '@/utils';
import { ReportPreviewModal } from '@/features/lab/reports/components/ReportPreviewModal';
import { generateLabReport, downloadPDF } from '@/features/lab/reports/utils/reportPDF';
import type { ReportData } from '@/features/lab/reports/types';
import type { Order } from '@/types';

export const Reports: React.FC = () => {
  const { orders, isLoading: ordersLoading } = useOrdersList();
  const { patients, isLoading: patientsLoading } = usePatientsList();
  const { isLoading: testsLoading } = useTestCatalog();
  const { getPatientName } = usePatientNameLookup();
  const { getTestName } = useTestNameLookup();

  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (ordersLoading || patientsLoading || testsLoading) return <div>Loading...</div>;

  // Orders with validated results ready for reports
  const validatedOrders = orders.filter(order =>
    order.tests.some(test => test.status === 'validated')
  );

  const prepareReportData = (order: Order): ReportData => {
    const patient = patients?.find(p => p.patientId === order.patientId);
    
    // Calculate age if DOB available
    let age: number | undefined;
    if (patient?.dateOfBirth) {
      const birthDate = new Date(patient.dateOfBirth);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    const testResults = order.tests
      .filter(test => test.status === 'validated' && test.results)
      .map(test => ({
        testCode: test.testCode,
        testName: test.testName,
        parameters: Object.entries(test.results || {}).map(([code, result]) => ({
          name: code,
          value: result.value,
          unit: result.unit,
          referenceRange: result.referenceRange,
          status: result.status,
          isCritical: result.status === 'critical' || result.status === 'critical-high' || result.status === 'critical-low',
        })),
        technicianNotes: test.technicianNotes,
        validationNotes: test.validationNotes,
        enteredBy: test.enteredBy?.toString(),
        validatedBy: test.validatedBy?.toString(),
        enteredAt: test.resultEnteredAt,
        validatedAt: test.resultValidatedAt,
      }));

    return {
      order,
      patientName: getPatientName(order.patientId),
      patientAge: age,
      patientGender: patient?.gender,
      testResults,
    };
  };

  const handlePreviewReport = (order: Order) => {
    setPreviewOrder(order);
  };

  const handleGenerateReport = async () => {
    if (!previewOrder) return;

    try {
      setIsGenerating(true);
      const reportData = prepareReportData(previewOrder);
      const doc = generateLabReport(reportData);
      
      const filename = `Lab_Report_ORD${previewOrder.orderId.toString().padStart(6, '0')}_${formatDate(new Date())}.pdf`;
      downloadPDF(doc, filename);
      
      toast.success('Report downloaded successfully');
      setPreviewOrder(null);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Reports</h1>
          <p className="text-text-tertiary">{validatedOrders.length} report(s) available</p>
        </div>

        <SectionContainer title="Validated Orders Ready for Reporting">
          {validatedOrders.length > 0 ? (
            <div className="space-y-3">
              {validatedOrders.map(order => (
                <div
                  key={order.orderId}
                  className="flex items-start justify-between p-4 border border-border rounded hover:border-brand/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Icon name={ICONS.dataFields.document} className="w-6 h-6 text-brand mt-1" />
                    <div>
                      <div className="font-medium text-text-primary">
                        <span className="font-mono">{displayId.order(order.orderId)}</span>
                      </div>
                      <div className="text-sm text-text-tertiary">{getPatientName(order.patientId)}</div>
                      <div className="text-sm text-text-tertiary">
                        {formatDate(order.orderDate)} • {order.tests.filter(t => t.status === 'validated').length} validated test(s)
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {order.tests
                          .filter(t => t.status === 'validated')
                          .map((test, idx) => (
                            <Badge
                              key={idx}
                              variant="success"
                              size="sm"
                              className="border-none font-medium"
                            >
                              {getTestName(test.testCode)}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handlePreviewReport(order)}
                    >
                      <Icon name="eye" className="w-4 h-4" />
                      Preview
                    </Button>
                    <Badge variant="validated" size="sm" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ICONS.dataFields.pdf}
              title="No Validated Orders"
              description="Orders must be validated before reports can be generated."
            />
          )}
        </SectionContainer>
      </div>

      {/* Report Preview Modal */}
      {previewOrder && (
        <ReportPreviewModal
          isOpen={!!previewOrder}
          onClose={() => setPreviewOrder(null)}
          reportData={prepareReportData(previewOrder)}
          onGenerate={handleGenerateReport}
          isGenerating={isGenerating}
        />
      )}
    </>
  );
};
