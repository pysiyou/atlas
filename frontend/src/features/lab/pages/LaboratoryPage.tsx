/**
 * Laboratory Page (canonical)
 * Lab operations - sample collection, result entry, validation, command center
 */

import React, { useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { SampleCollectionQueue } from '../collection/SampleCollectionQueue';
import { ResultEntryQueue } from '../entry/ResultEntryQueue';
import { ResultValidationQueue } from '../validation/ResultValidationQueue';
import { LabCommandCenterBoard } from '../commandCenter/LabCommandCenterBoard';
import { Icon, PageHeader, Badge, ErrorAlert } from '@/components';
import { errorAlertMessage } from '@/utils/feedback';
import { ICONS } from '@/config/icons';
import { WORKSPACE } from '@/components/theme/recipes';
import { LAB_WORKFLOW_QUEUE_SHELL, LAB_PAGE_TABS } from '../utils/labStyles';
import { useLabStageQueueCounts, getValidationTabCount } from '../hooks';
import {
  DEFAULT_LAB_TAB,
  isLabTabId,
  LAB_TAB_LABELS,
  type LabTabId,
  getLabTabPath,
} from '../constants/labConstants';

export const LaboratoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { tab: tabParam } = useParams<{ tab?: string }>();
  const { counts, isError, error, refetch } = useLabStageQueueCounts();

  const activeTab: LabTabId = isLabTabId(tabParam) ? tabParam : DEFAULT_LAB_TAB;

  useEffect(() => {
    if (!tabParam) {
      navigate(getLabTabPath(DEFAULT_LAB_TAB), { replace: true });
      return;
    }
    if (!isLabTabId(tabParam)) {
      navigate(getLabTabPath(DEFAULT_LAB_TAB), { replace: true });
    }
  }, [tabParam, navigate]);

  const handleTabChange = useCallback(
    (tab: LabTabId) => {
      navigate(getLabTabPath(tab));
    },
    [navigate]
  );

  const tabs = useMemo((): Array<{ id: LabTabId; label: string; icon: React.ReactNode; count?: number }> => {
    return [
      {
        id: 'collection',
        label: LAB_TAB_LABELS.collection,
        icon: <Icon name={ICONS.dataFields.flask} className="w-3.5 h-3.5" />,
        count: counts.collection,
      },
      {
        id: 'entry',
        label: LAB_TAB_LABELS.entry,
        icon: <Icon name={ICONS.dataFields.notebook} className="w-3.5 h-3.5" />,
        count: counts.entry,
      },
      {
        id: 'validation',
        label: LAB_TAB_LABELS.validation,
        icon: <Icon name={ICONS.ui.shieldCheck} className="w-3.5 h-3.5" />,
        count: getValidationTabCount(counts),
      },
      {
        id: 'command-center',
        label: LAB_TAB_LABELS['command-center'],
        icon: <Icon name={ICONS.ui.dashboard} className="w-3.5 h-3.5" />,
      },
    ];
  }, [counts]);

  if (!tabParam) {
    return <Navigate to={getLabTabPath(DEFAULT_LAB_TAB)} replace />;
  }

  if (!isLabTabId(tabParam)) {
    return <Navigate to={getLabTabPath(DEFAULT_LAB_TAB)} replace />;
  }

  const pageTitle = LAB_TAB_LABELS[activeTab];

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
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`${LAB_PAGE_TABS.buttonBase} ${
                    isActive ? LAB_PAGE_TABS.buttonActive : LAB_PAGE_TABS.buttonInactive
                  }`}
                >
                  <div
                    className={`${isActive ? LAB_PAGE_TABS.iconActive : LAB_PAGE_TABS.iconInactive} flex items-center`}
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
          activeTab === 'command-center' ? 'flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden' : LAB_WORKFLOW_QUEUE_SHELL
        }
      >
        <div
          className={`flex-1 flex flex-col min-h-0 overflow-hidden ${
            activeTab === 'command-center' ? '' : 'bg-surface-page'
          }`}
        >
          {isError ? (
            <div className={WORKSPACE.contentInset}>
              <ErrorAlert
                error={{
                  message: errorAlertMessage('lab.page.loadFailed', error),
                }}
                onRetry={() => refetch()}
              />
            </div>
          ) : (
            <>
              {activeTab === 'collection' && <SampleCollectionQueue />}
              {activeTab === 'entry' && <ResultEntryQueue />}
              {activeTab === 'validation' && <ResultValidationQueue />}
              {activeTab === 'command-center' && (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  <LabCommandCenterBoard />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
