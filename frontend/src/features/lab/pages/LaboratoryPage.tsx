/**
 * Laboratory Page (canonical)
 * Lab operations - sample collection, result entry, validation, escalation, command center
 */

import React, { useMemo, useState } from 'react';
import { CollectionView } from '@/features/collection/CollectionView';
import { EntryView } from '@/features/entry/EntryView';
import { ValidationView } from '@/features/validation/ValidationView';
import { EscalationView } from '@/features/validation/EscalationView';
import { CommandCenterView } from '@/features/command-center';
import { useAuthStore } from '@/app/store';
import { Icon, PageHeaderBar, Badge } from '@/components';
import { ICONS } from '@/utils';
import { useOrdersList } from '@/features/orders/api/useOrderQueries';
import { useSamplesList } from '@/features/collection/api/useSamples';
import { usePendingEscalation } from '@/features/validation/api/usePendingEscalation';
import { useTestCatalog } from '@/features/catalog/api/useTestCatalog';
import { usePatientNameLookup } from '@/features/patients/api/usePatients';
import { useOrderLookup } from '@/features/orders/utils/useOrderUtils';
import { useCollectionSampleDisplays } from '@/features/collection/hooks/useCollectionSampleDisplays';
import { useLabTestsFromOrders } from '@/features/lab/hooks';

type LabTabId = 'collection' | 'entry' | 'validation' | 'escalation' | 'dashboard';

export const Laboratory: React.FC = () => {
  const { hasRole } = useAuthStore();
  const canResolveEscalation = hasRole(['administrator', 'lab-technician-plus']);

  const [activeTab, setActiveTab] = useState<LabTabId>('dashboard');

  // Fetch data for counts (aligned with each tab's view logic)
  const { orders } = useOrdersList();
  const { samples = [] } = useSamplesList();
  const { tests = [] } = useTestCatalog();
  const { getPatient, getPatientName } = usePatientNameLookup();
  const { getOrder } = useOrderLookup();
  const { escalatedTests } = usePendingEscalation();

  const { displays: collectionDisplays } = useCollectionSampleDisplays({
    samples,
    tests,
    getOrder,
    getPatient,
    getPatientName,
  });

  const entryTests = useLabTestsFromOrders({
    orders,
    testCatalog: tests,
    statusFilter: ['sample-collected'],
    includePatient: true,
  });

  const validationTests = useLabTestsFromOrders({
    orders,
    testCatalog: tests,
    statusFilter: ['resulted'],
    onlyUnvalidated: true,
  });

  // Calculate counts for each tab
  const counts = useMemo(() => {
    const collectionCount = collectionDisplays.filter(d => d.sample.status === 'pending').length;
    const entryCount = entryTests.length;
    const validationCount = validationTests.length;
    const escalationCount = escalatedTests?.length || 0;

    return {
      collection: collectionCount,
      entry: entryCount,
      validation: validationCount,
      escalation: escalationCount,
    };
  }, [collectionDisplays, entryTests, validationTests, escalatedTests]);

  const tabs = useMemo((): Array<{ id: LabTabId; label: string; icon: React.ReactNode; count?: number }> => {
    const base: Array<{ id: LabTabId; label: string; icon: React.ReactNode; count?: number }> = [
      {
        id: 'collection',
        label: 'Sample Collection',
        icon: <Icon name={ICONS.dataFields.flask} className="w-4 h-4" />,
        count: counts.collection,
      },
      {
        id: 'entry',
        label: 'Result Entry',
        icon: <Icon name={ICONS.dataFields.notebook} className="w-4 h-4" />,
        count: counts.entry,
      },
      {
        id: 'validation',
        label: 'Result Validation',
        icon: <Icon name={ICONS.ui.shieldCheck} className="w-4 h-4" />,
        count: counts.validation,
      },
    ];
    if (canResolveEscalation) {
      base.push({
        id: 'escalation',
        label: 'Supervisor Review',
        icon: <Icon name={ICONS.actions.alertCircle} className="w-4 h-4" />,
        count: counts.escalation,
      });
    }
    base.push({
      id: 'dashboard',
      label: 'Command Center',
      icon: <Icon name={ICONS.ui.dashboard} className="w-4 h-4" />,
    });
    return base;
  }, [canResolveEscalation, counts]);

  const activeTabConfig = tabs.find(t => t.id === activeTab);
  const pageTitle = activeTabConfig?.label ?? 'Laboratory';

  return (
    <div className="min-h-full flex flex-col p-2 gap-2 min-w-0">
      {/* Page Header: title with tabs on the right */}
      <PageHeaderBar title={pageTitle}>
        <div className="bg-neutral-200/60 p-1 rounded flex items-center gap-1">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            const hasCount = typeof tab.count === 'number' && tab.count > 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center gap-2 px-3 py-1.5 rounded text-xs font-normal transition-all duration-200 cursor-pointer
                  ${
                    isActive
                      ? 'bg-surface text-brand shadow-sm ring-1 ring-black/5'
                      : 'text-text-tertiary hover:text-text-primary hover:bg-neutral-200/50'
                  }
                `}
              >
                <div
                  className={`${isActive ? 'text-brand' : 'text-text-disabled'} flex items-center`}
                >
                  {tab.icon}
                </div>
                {tab.label}
                {hasCount && (
                  <Badge
                    variant={isActive ? 'primary' : 'default'}
                    size="xs"
                    className="ml-1"
                  >
                    {tab.count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </PageHeaderBar>

      {/* Main Content Card */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-surface rounded border border-border-default shadow-sm overflow-hidden">
        {/* Content Area: flex column, no scroll – filter + grid handle layout like ListView */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-surface-page">
          {activeTab === 'collection' && <CollectionView />}
          {activeTab === 'entry' && <EntryView />}
          {activeTab === 'validation' && <ValidationView />}
          {activeTab === 'escalation' && canResolveEscalation && <EscalationView />}
          {activeTab === 'dashboard' && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <CommandCenterView />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
