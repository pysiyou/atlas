/**
 * Laboratory Page (canonical)
 * Lab operations - sample collection, result entry, validation, command center
 */

import React, { useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { Icon } from '@/components/primitives';
import { PageHeader } from '@/components/layout';
import { ICONS } from '@/config/icons';
import { WORKSPACE } from '@/theme/recipes';
import { useLabStageQueueCounts, getValidationTabCount } from '../hooks';
import {
  DEFAULT_LAB_TAB,
  normalizeLabTabParam,
  LAB_COPY,
  LAB_TAB_LABELS,
  LAB_WORKFLOW_TAB_ICONS,
  type LabTabId,
  getLabTabPath,
} from '../constants/labConstants';
import { useAuthStore } from '@/app/authStore';
import { tabAllowed } from './laboratoryPageAccess';
import { LaboratoryPageTabRail, type LaboratoryPageTabDef } from './LaboratoryPageTabRail';
import { LaboratoryPageStageContent } from './LaboratoryPageStageContent';

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

  const tabs = useMemo((): LaboratoryPageTabDef[] => {
    const all: LaboratoryPageTabDef[] = [
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
          <LaboratoryPageTabRail
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        }
      />

      <LaboratoryPageStageContent
        activeTab={activeTab}
        hasRole={hasRole}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
      />
    </div>
  );
};
