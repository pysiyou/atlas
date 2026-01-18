/**
 * Reports Page
 * Report generation and management
 */

import React from 'react';
import { useOrders } from '@/features/order/OrderContext';
import { usePatients } from '@/hooks';
import { useTests } from '@/features/test/TestsContext';
import { SectionContainer, Badge, Button, EmptyState } from '@/shared/ui';
import { formatDate } from '@/utils';
import { getPatientName, getTestName } from '@/utils/typeHelpers';
import { FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export const Reports: React.FC = () => {
  const ordersContext = useOrders();
  const patientsContext = usePatients();
  const testsContext = useTests();
  
  if (!ordersContext || !patientsContext || !testsContext) return <div>Loading...</div>;
  
  const { orders } = ordersContext;
  const { patients } = patientsContext;
  const { tests } = testsContext;
  
  // Orders with validated results ready for reports
  const validatedOrders = orders.filter(order =>
    order.tests.some(test => test.status === 'validated')
  );
  
  const handleGenerateReport = (orderId: string) => {
    toast.success(`Report generated for ${orderId} (PDF generation simulated)`);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600">{validatedOrders.length} report(s) available</p>
      </div>
      
      <SectionContainer title="Validated Orders Ready for Reporting">
        {validatedOrders.length > 0 ? (
          <div className="space-y-3">
            {validatedOrders.map(order => (
              <div key={order.orderId} className="flex items-start justify-between p-4 border border-gray-200 rounded">
                <div className="flex items-start gap-3">
                  <FileText className="text-sky-600 mt-1" size={24} />
                  <div>
                    <div className="font-medium text-gray-900">{order.orderId}</div>
                    <div className="text-sm text-gray-600">{getPatientName(order.patientId, patients)}</div>
                    <div className="text-sm text-gray-500">
                      {formatDate(order.orderDate)} • {order.tests.length} test(s)
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {order.tests.filter(t => t.status === 'validated').map((test, idx) => (
                        <Badge key={idx} variant="success" size="sm" className="border-none font-medium">
                          {getTestName(test.testCode, tests)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleGenerateReport(order.orderId)}
                    className="flex items-center gap-1"
                  >
                    <Download size={16} />
                    Generate PDF
                  </Button>
                  <Badge variant="success" size="sm" className="border-none font-medium">VALIDATED</Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="pdf"
            title="No Validated Orders"
            description="Orders must be validated before reports can be generated."
          />
        )}
      </SectionContainer>
    </div>
  );
};
