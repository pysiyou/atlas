/**
 * Laboratory Page (canonical)
 * Lab operations - sample collection, result entry, validation, escalation, command center
 */

import React, { useMemo, useState } from 'react';
import { CollectionView } from '../collection/CollectionView';
import { EntryView } from '../entry/EntryView';
import { ValidationView } from '../validation/ValidationView';
import { EscalationView } from '../validation/EscalationView';
import { CommandCenterDashboard } from '@/features/lab/command-center';
import { useAuthStore } from '@/shared/stores/auth.store';
import { Icon } from '@/shared/ui';
import { ICONS } from '@/utils';

type LabTabId = 'collection' | 'entry' | 'validation' | 'escalation' | 'dashboard';

export const Laboratory: React.FC = () => {
  const { hasRole } = useAuthStore();
  const canResolveEscalation = hasRole(['administrator', 'lab-technician-plus']);

  const [activeTab, setActiveTab] = useState<LabTabId>('collection');

  const tabs = useMemo((): Array<{ id: LabTabId; label: string; icon: React.ReactNode }> => {
    const base: Array<{ id: LabTabId; label: string; icon: React.ReactNode }> = [
      {
        id: 'collection',
        label: 'Sample Collection',
        icon: <Icon name={ICONS.dataFields.flask} className="w-4 h-4" />,
      },
      {
        id: 'entry',
        label: 'Result Entry',
        icon: <Icon name={ICONS.dataFields.notebook} className="w-4 h-4" />,
      },
      {
        id: 'validation',
        label: 'Result Validation',
        icon: <Icon name={ICONS.ui.shieldCheck} className="w-4 h-4" />,
      },
    ];
    if (canResolveEscalation) {
      base.push({
        id: 'escalation',
        label: 'Escalation',
        icon: <Icon name={ICONS.actions.alertCircle} className="w-4 h-4" />,
      });
    }
    base.push({
      id: 'dashboard',
      label: 'Command Center',
      icon: <Icon name={ICONS.ui.dashboard} className="w-4 h-4" />,
    });
    return base;
  }, [canResolveEscalation]);

  const activeTabConfig = tabs.find(t => t.id === activeTab);
  const pageTitle = activeTabConfig?.label ?? 'Laboratory';

  return (
    <div className="h-full flex flex-col p-4 space-y-6">
      {/* Page Header: title with tabs on the right */}
      <div className="shrink-0 flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-text-primary">{pageTitle}</h1>
        <div className="bg-neutral-200/60 p-1 rounded flex items-center gap-1">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 cursor-pointer
                  ${
                    isActive
                      ? 'bg-surface text-brand shadow-sm shadow-gray-200 ring-1 ring-black/5'
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
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Card */}
      <div className="flex-1 flex flex-col bg-surface rounded border border-border shadow-sm overflow-hidden min-h-0">
        {/* Content Area: flex column, no scroll – filter + grid handle layout like ListView */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-app-bg">
          {activeTab === 'collection' && <CollectionView />}
          {activeTab === 'entry' && <EntryView />}
          {activeTab === 'validation' && <ValidationView />}
          {activeTab === 'escalation' && canResolveEscalation && <EscalationView />}
          {activeTab === 'dashboard' && (
            <CommandCenterDashboard onNavigateToTab={setActiveTab} />
          )}
        </div>
      </div>
    </div>
  );
};
