/**
 * Laboratory Page (canonical)
 * Lab operations - sample collection, result entry, validation, escalation, command center
 */

import React, { useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { CollectionView } from '@/features/lab-collection/pages/CollectionView';
import { EntryView } from '@/features/lab-entry/pages/EntryView';
import { ValidationView } from '@/features/lab-validation/pages/ValidationView';
import { EscalationView } from '@/features/lab-validation/pages/EscalationView';
import { CommandCenterView } from '@/features/lab-command-center';
import { useAuthStore } from '@/app/store';
import { Icon, PageHeaderBar, Badge } from '@/components';
import { ICONS } from '@/utils';
import { useLabPipelineCounts } from '@/features/lab/hooks';
import {
  DEFAULT_LAB_TAB,
  isLabTabId,
  LAB_TAB_LABELS,
  type LabTabId,
  getLabTabPath,
} from '@/features/lab/constants/labTabs';

export const Laboratory: React.FC = () => {
  const navigate = useNavigate();
  const { tab: tabParam } = useParams<{ tab?: string }>();
  const { hasRole } = useAuthStore();
  const canResolveEscalation = hasRole(['administrator', 'lab-technician-plus']);
  const { counts } = useLabPipelineCounts();

  const activeTab: LabTabId = isLabTabId(tabParam) ? tabParam : DEFAULT_LAB_TAB;

  useEffect(() => {
    if (!tabParam) {
      navigate(getLabTabPath(DEFAULT_LAB_TAB), { replace: true });
      return;
    }
    if (!isLabTabId(tabParam)) {
      navigate(getLabTabPath(DEFAULT_LAB_TAB), { replace: true });
      return;
    }
    if (tabParam === 'escalation' && !canResolveEscalation) {
      navigate(getLabTabPath(DEFAULT_LAB_TAB), { replace: true });
    }
  }, [tabParam, canResolveEscalation, navigate]);

  const handleTabChange = useCallback(
    (tab: LabTabId) => {
      navigate(getLabTabPath(tab));
    },
    [navigate]
  );

  const tabs = useMemo((): Array<{ id: LabTabId; label: string; icon: React.ReactNode; count?: number }> => {
    const base: Array<{ id: LabTabId; label: string; icon: React.ReactNode; count?: number }> = [
      {
        id: 'collection',
        label: LAB_TAB_LABELS.collection,
        icon: <Icon name={ICONS.dataFields.flask} className="w-4 h-4" />,
        count: counts.collection,
      },
      {
        id: 'entry',
        label: LAB_TAB_LABELS.entry,
        icon: <Icon name={ICONS.dataFields.notebook} className="w-4 h-4" />,
        count: counts.entry,
      },
      {
        id: 'validation',
        label: LAB_TAB_LABELS.validation,
        icon: <Icon name={ICONS.ui.shieldCheck} className="w-4 h-4" />,
        count: counts.validation,
      },
    ];
    if (canResolveEscalation) {
      base.push({
        id: 'escalation',
        label: LAB_TAB_LABELS.escalation,
        icon: <Icon name={ICONS.actions.alertCircle} className="w-4 h-4" />,
        count: counts.escalation,
      });
    }
    base.push({
      id: 'dashboard',
      label: LAB_TAB_LABELS.dashboard,
      icon: <Icon name={ICONS.ui.dashboard} className="w-4 h-4" />,
    });
    return base;
  }, [canResolveEscalation, counts]);

  if (!tabParam || !isLabTabId(tabParam)) {
    return <Navigate to={getLabTabPath(DEFAULT_LAB_TAB)} replace />;
  }

  if (tabParam === 'escalation' && !canResolveEscalation) {
    return <Navigate to={getLabTabPath(DEFAULT_LAB_TAB)} replace />;
  }

  const pageTitle = LAB_TAB_LABELS[activeTab];

  return (
    <div className="min-h-full flex flex-col p-2 gap-2 min-w-0">
      <PageHeaderBar title={pageTitle}>
        <div className="bg-neutral-200/60 p-1 rounded flex items-center gap-1">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            const hasCount = typeof tab.count === 'number' && tab.count > 0;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
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

      <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-surface rounded border border-border-default shadow-sm overflow-hidden">
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
