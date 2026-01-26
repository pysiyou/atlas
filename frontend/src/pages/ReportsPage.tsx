/**
 * Reports Page
 * Report generation and management
 */

import React from 'react';
import {
  useOrdersList,
  usePatientsList,
  useTestCatalog,
  usePatientNameLookup,
  useTestNameLookup,
} from '@/hooks/queries';
import { SectionContainer, Badge, Button, EmptyState, Icon } from '@/shared/ui';
import { formatDate } from '@/utils';
import { displayId } from '@/utils/id-display';
import toast from 'react-hot-toast';
import { ICONS } from '@/utils/icon-mappings';

export const Reports: React.FC = () => {
  const { orders, isLoading: ordersLoading } = useOrdersList();
  const { isLoading: patientsLoading } = usePatientsList();
  const { isLoading: testsLoading } = useTestCatalog();
  const { getPatientName } = usePatientNameLookup();
  const { getTestName } = useTestNameLookup();

  if (ordersLoading || patientsLoading || testsLoading) return <div>Loading...</div>;

  // Orders with validated results ready for reports
  const validatedOrders = orders.filter(order =>
    order.tests.some(test => test.status === 'validated')
  );

  const handleGenerateReport = (orderId: number | string) => {
    const orderIdStr = typeof orderId === 'string' ? orderId : orderId.toString();
    toast.success(`Report generated for ${orderIdStr} (PDF generation simulated)`);
  };

  return (
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
                className="flex items-start justify-between p-4 border border-border rounded"
              >
                <div className="flex items-start gap-3">
                  <Icon name={ICONS.dataFields.document} className="w-6 h-6 text-brand mt-1" />
                  <div>
                    <div className="font-medium text-text-primary">
                      <span className="font-mono">{displayId.order(order.orderId)}</span>
                    </div>
                    <div className="text-sm text-text-tertiary">{getPatientName(order.patientId)}</div>
                    <div className="text-sm text-text-tertiary">
                      {formatDate(order.orderDate)} • {order.tests.length} test(s)
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
                    variant="download"
                    size="sm"
                    onClick={() => handleGenerateReport(order.orderId)}
                  >
                    Generate PDF
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
  );
};
