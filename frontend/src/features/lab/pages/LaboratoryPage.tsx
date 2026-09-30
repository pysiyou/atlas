/**
 * Laboratory Page (canonical)
 * Lab operations - sample collection, result entry, validation, command center
 */

import React, { useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { SampleCollectionQueue } from '../collection/SampleCollectionQueue';
import { ResultEntryQueue } from '../entry/ResultEntryQueue';
import { ResultValidationQueue } from '../validation/ResultValidationQueue';
import { LabMonitorBoard } from '../monitor/LabMonitorBoard';
import { Icon, PageHeader, Badge, ErrorAlert } from '@/components';
import { errorAlertMessage } from '@/utils/feedback';
import { ICONS } from '@/config/icons';
import { WORKSPACE, CONTROL } from '@/components/theme/recipes';
import { LAB_WORKFLOW_QUEUE_SHELL, LAB_PAGE_TABS } from '../utils/labStyles';
import { useLabStageQueueCounts, getValidationTabCount } from '../hooks';
import {
  DEFAULT_LAB_TAB,
  normalizeLabTabParam,
  isLabWorkflowStageTab,
  getStageVisual,
  LAB_COPY,
  LAB_TAB_LABELS,
  LAB_WORKFLOW_TAB_ICONS,
  type LabTabId,
  getLabTabPath,
} from '../constants/labConstants';
import { cn } from '@/utils';
import { useAuthStore } from '@/app/authStore';
import type { UserRole } from '@/types';

const LAB_TECH_ROLES: UserRole[] = ['administrator', 'lab-technician', 'lab-technician-plus'];
const COLLECTION_ROLES: UserRole[] = [
  'administrator',
  'receptionist',
  'lab-technician',
  'lab-technician-plus',
];

function tabAllowed(tab: LabTabId, hasRole: (roles: UserRole | UserRole[]) => boolean): boolean {
  if (tab === 'collection') return hasRole(COLLECTION_ROLES);
  if (tab === 'monitor') return hasRole(LAB_TECH_ROLES);
  return hasRole(LAB_TECH_ROLES);
}

export const LaboratoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { tab: tabParam } = useParams<{ tab?: string }>();
  const { hasRole } = useAuthStore();
  const { counts, isError, error, refetch } = useLabStageQueueCounts();

  const activeTab: LabTabId = normalizeLabTabParam(tabParam) ?? DEFAULT_LAB_TAB;

  useEffect(() => {
    if (!tabParam) {
      navigate(getLabTabPath(DEFAULT_LAB_TAB), { replace: true });
      return;
    }
    const normalized = normalizeLabTabParam(tabParam);
    if (!normalized) {
      navigate(getLabTabPath(DEFAULT_LAB_TAB), { replace: true });
      return;
    }
    if (tabParam !== normalized) {
      navigate(getLabTabPath(normalized), { replace: true });
    }
  }, [tabParam, navigate]);

  const handleTabChange = useCallback(
    (tab: LabTabId) => {
      navigate(getLabTabPath(tab));
    },
    [navigate]
  );

  const tabs = useMemo((): Array<{ id: LabTabId; label: string; icon: React.ReactNode; count?: number }> => {
    const all: Array<{ id: LabTabId; label: string; icon: React.ReactNode; count?: number }> = [
      {
        id: 'collection',
        label: LAB_TAB_LABELS.collection,
        icon: <Icon name={LAB_WORKFLOW_TAB_ICONS.collection} className="w-3.5 h-3.5" />,
        count: counts.collection,
      },
      {
        id: 'entry',
        label: LAB_TAB_LABELS.entry,
        icon: <Icon name={LAB_WORKFLOW_TAB_ICONS.entry} className="w-3.5 h-3.5" />,
        count: counts.entry,
      },
      {
        id: 'validation',
        label: LAB_TAB_LABELS.validation,
        icon: <Icon name={LAB_WORKFLOW_TAB_ICONS.validation} className="w-3.5 h-3.5" />,
        count: getValidationTabCount(counts),
      },
      {
        id: 'monitor',
        label: LAB_TAB_LABELS.monitor,
        icon: <Icon name={ICONS.dataFields.pulse} className="w-3.5 h-3.5" />,
      },
    ];
    return all.filter(tab => tabAllowed(tab.id, hasRole));
  }, [counts, hasRole]);

  if (!tabParam) {
    return <Navigate to={getLabTabPath(DEFAULT_LAB_TAB)} replace />;
  }

  if (!normalizeLabTabParam(tabParam)) {
    return <Navigate to={getLabTabPath(DEFAULT_LAB_TAB)} replace />;
  }

  if (!tabAllowed(activeTab, hasRole)) {
    const fallback = tabs[0]?.id ?? DEFAULT_LAB_TAB;
    return <Navigate to={getLabTabPath(fallback)} replace />;
  }

  const pageTitle =
    activeTab === 'monitor' ? LAB_COPY.workflow.monitorPageTitle : LAB_TAB_LABELS[activeTab];

  return (
    <div className={WORKSPACE.page}>
      <PageHeader
        variant="bar"
        title={pageTitle}
        actions={
          <div className={LAB_PAGE_TABS.rail}>
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              const hasCount = typeof tab.count === 'number' && tab.count > 0;
              const stageVisual = isLabWorkflowStageTab(tab.id) ? getStageVisual(tab.id) : null;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    LAB_PAGE_TABS.buttonBase,
                    isActive
                      ? stageVisual
                        ? `bg-surface ${stageVisual.text} ${CONTROL.segmentActive}`
                        : LAB_PAGE_TABS.buttonActive
                      : LAB_PAGE_TABS.buttonInactive,
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center',
                      isActive
                        ? stageVisual
                          ? stageVisual.text
                          : LAB_PAGE_TABS.iconActive
                        : LAB_PAGE_TABS.iconInactive,
                    )}
                  >
                    {tab.icon}
                  </div>
                  {tab.label}
                  {hasCount && (
                    <Badge
                      variant={isActive ? 'primary' : 'default'}
                      size="xs"
                      className={LAB_PAGE_TABS.countBadgeMargin}
                    >
                      {tab.count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        }
      />

      <div
        className={
          activeTab === 'monitor' ? 'flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden' : LAB_WORKFLOW_QUEUE_SHELL
        }
      >
        {isError && (
          <div className={`${WORKSPACE.contentInset} shrink-0 pb-0`}>
            <ErrorAlert
              error={{
                message: errorAlertMessage('lab.page.loadFailed', error),
              }}
              onRetry={() => refetch()}
            />
          </div>
        )}
        <div
          className={`flex-1 flex flex-col min-h-0 overflow-hidden ${
            activeTab === 'monitor' ? '' : 'bg-surface-page'
          }`}
        >
          {activeTab === 'collection' && tabAllowed('collection', hasRole) && (
            <SampleCollectionQueue />
          )}
          {activeTab === 'entry' && tabAllowed('entry', hasRole) && <ResultEntryQueue />}
          {activeTab === 'validation' && tabAllowed('validation', hasRole) && (
            <ResultValidationQueue />
          )}
          {activeTab === 'monitor' && tabAllowed('monitor', hasRole) && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <LabMonitorBoard />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
