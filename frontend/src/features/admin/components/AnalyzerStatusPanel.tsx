/**
 * AnalyzerStatusPanel - Instrument integration overview for administrators.
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { SectionContainer, Badge } from '@/components';
import { useOrdersList } from '@/features/orders/api/useOrderQueries';
import { useTestCatalog } from '@/features/catalog/api/useTestCatalog';
import { useLabTestsFromOrders } from '@/features/lab/hooks';
import { getLabTabPath } from '@/features/lab/constants/labTabs';
import { ROUTES } from '@/config';

export const AnalyzerStatusPanel: React.FC = () => {
  const { orders } = useOrdersList();
  const { tests: testCatalog = [] } = useTestCatalog();

  const pendingInstrumentWork = useLabTestsFromOrders({
    orders,
    testCatalog,
    statusFilter: ['sample-collected'],
  });

  const endpoints = useMemo(
    () => [
      { label: 'HL7 ingestion', path: '/api/v1/analyzer/hl7', method: 'POST' },
      { label: 'JSON results', path: '/api/v1/analyzer/results', method: 'POST' },
      { label: 'Pending work poll', path: '/api/v1/analyzer/pending/{analyzer_id}', method: 'GET' },
    ],
    []
  );

  return (
    <SectionContainer title="Analyzer Integration">
      <div className="space-y-4 text-sm">
        <p className="text-text-secondary">
          Laboratory analyzers submit results via authenticated API endpoints. Results flow through
          the same validation pipeline as manual entry.
        </p>

        <div className="space-y-2">
          {endpoints.map(endpoint => (
            <div
              key={endpoint.path}
              className="flex items-center justify-between gap-3 p-3 border border-border-default rounded-md bg-surface-page"
            >
              <div>
                <div className="font-normal text-text-primary">{endpoint.label}</div>
                <div className="text-xs font-mono text-text-tertiary">{endpoint.path}</div>
              </div>
              <Badge variant="default" size="xs">
                {endpoint.method}
              </Badge>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between p-3 border border-border-default rounded-md">
          <div>
            <div className="text-text-primary font-normal">Pending instrument work</div>
            <div className="text-xs text-text-tertiary">
              Tests awaiting analyzer result entry (sample collected)
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={pendingInstrumentWork.length > 0 ? 'warning' : 'success'} size="sm">
              {pendingInstrumentWork.length}
            </Badge>
            <Link to={getLabTabPath('entry')} className="text-xs text-brand hover:underline">
              Open Entry Queue
            </Link>
          </div>
        </div>

        <p className="text-xs text-text-tertiary">
          Configure analyzer authentication via the <code className="font-mono">X-Analyzer-Key</code>{' '}
          header. Manage users and system access in{' '}
          <Link to={ROUTES.ADMIN} className="text-brand hover:underline">
            Administration
          </Link>
          .
        </p>
      </div>
    </SectionContainer>
  );
};
