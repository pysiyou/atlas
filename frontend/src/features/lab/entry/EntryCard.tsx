/**
 * EntryCard — responsive card for result entry (mobile + desktop).
 */

import React, { useMemo } from 'react';
import { Badge, Card, IconButton } from '@/components';
import { cn } from '@/utils';
import { usePatientNameLookup } from '@/features/patients';
import { useLabCardClickGuard, useTestWorkItemState } from '@/features/lab/hooks';
import { useResponsiveCard } from '../components/useResponsiveCard';
import { LabCard, ProgressBadge } from '../components/LabCard';
import { TestHeaderBadges } from '../components/labWorkflowBadges';
import { testHeaderAudit } from '../components/labHeader';
import { LabMobileCardHeader, labMobileCardSurfaceClassName } from '../components/labMobileCardHeader';
import { LAB_CONFIG } from '../constants';
import { LAB_CARD_TYPOGRAPHY } from '../utils/labStyles';
import { deriveRetestContext } from '../utils/deriveRetestContext';
import type { Test, TestWithContext } from '@/types';

export interface EntryCardProps {
  test: TestWithContext;
  testDef: Test | undefined;
  resultKey: string;
  results: Record<string, string>;
  technicianNotes: string;
  isComplete: boolean;
  onResultsChange: (resultKey: string, paramCode: string, value: string) => void;
  onNotesChange: (resultKey: string, notes: string) => void;
  onSave: () => void;
  onClick: () => void;
  isMobile?: boolean;
}

interface EntryCardSharedData {
  test: TestWithContext;
  testDef: Test;
  results: Record<string, string>;
  isComplete: boolean;
  patientName: string;
  parameterCount: number;
  filledCount: number;
  handleCardClick: (e?: React.MouseEvent) => void;
  workItem: ReturnType<typeof useTestWorkItemState>;
  rejection: ReturnType<typeof deriveRetestContext>;
}

function useEntryCardData(props: EntryCardProps): EntryCardSharedData | null {
  const { test, testDef, results, isComplete, onClick } = props;
  const { getPatientName } = usePatientNameLookup();
  const handleCardClick = useLabCardClickGuard(onClick);
  const workItem = useTestWorkItemState(test);
  const rejection = useMemo(() => deriveRetestContext(test), [test]);

  if (!testDef?.parameters) return null;

  const patientName = getPatientName(test.patientId);
  const parameterCount = testDef.parameters.length;
  const filledCount = Object.values(results).filter(v => v?.trim()).length;

  return {
    test,
    testDef,
    results,
    isComplete,
    patientName,
    parameterCount,
    filledCount,
    handleCardClick,
    workItem,
    rejection,
  };
}

function EntryCardDesktop({
  test,
  testDef,
  results,
  isComplete,
  parameterCount,
  filledCount,
  handleCardClick,
  workItem,
  rejection,
}: EntryCardSharedData) {
  const { showAttemptIndicator } = rejection;

  return (
    <LabCard
      onClick={handleCardClick}
      className={showAttemptIndicator ? 'border-warning-stroke-emphasis' : ''}
      context={{
        patientName: test.patientName,
        patientId: test.patientId,
        orderId: test.orderId,
        orderTestId: test.id,
        sampleId: test.sampleId,
        entityCode: test.testCode,
        entityName: test.testName,
        referringPhysician: test.referringPhysician,
      }}
      auditLines={testHeaderAudit(test)}
      badges={
        <TestHeaderBadges
          test={test}
          variant="entry"
          queueSince={test.collectedAt}
          blockedLabel={workItem.blockedReason ? workItem.label : undefined}
        />
      }
      actions={
        <ProgressBadge
          count={filledCount}
          total={parameterCount}
          label="PARAMS"
          isComplete={isComplete}
        />
      }
      content={
        <div className="flex flex-wrap gap-1.5">
          {testDef.parameters &&
            testDef.parameters.slice(0, LAB_CONFIG.PARAMETER_PREVIEW_LIMIT).map(param => (
              <Badge
                key={param.code}
                size="sm"
                uppercase={false}
                className={
                  results[param.code] ? LAB_CARD_TYPOGRAPHY.fieldValue : LAB_CARD_TYPOGRAPHY.fieldLabel
                }
                variant={results[param.code] ? 'primary' : 'default'}
              >
                {param.name}
              </Badge>
            ))}
          {parameterCount > LAB_CONFIG.PARAMETER_PREVIEW_LIMIT && (
            <Badge size="sm" variant="default" className={LAB_CARD_TYPOGRAPHY.fieldLabel}>
              +{parameterCount - LAB_CONFIG.PARAMETER_PREVIEW_LIMIT} more
            </Badge>
          )}
        </div>
      }
      contentTitle={`Parameters (${parameterCount})`}
    />
  );
}

function EntryCardMobile({
  test,
  patientName,
  handleCardClick,
  workItem,
  rejection,
}: EntryCardSharedData) {
  const { showAttemptIndicator } = rejection;

  return (
    <Card
      padding="list"
      hover
      className={cn(
        labMobileCardSurfaceClassName(),
        showAttemptIndicator && 'border-warning-stroke-emphasis'
      )}
      onClick={handleCardClick}
    >
      <LabMobileCardHeader
        context={{
          patientName,
          patientId: test.patientId,
          orderId: test.orderId,
          orderTestId: test.id,
          sampleId: test.sampleId,
          entityCode: test.testCode,
          entityName: test.testName,
        }}
        auditLines={testHeaderAudit(test)}
        badges={
          <TestHeaderBadges
            test={test}
            variant="entry"
            size="xs"
            queueSince={test.collectedAt}
            blockedLabel={workItem.blockedReason ? workItem.label : undefined}
          />
        }
        actions={
          <IconButton
            variant="edit"
            size="sm"
            title="Enter Results"
            onClick={e => {
              e.stopPropagation();
              handleCardClick();
            }}
          />
        }
      />
    </Card>
  );
}

export const EntryCard: React.FC<EntryCardProps> = props => {
  const sharedData = useEntryCardData(props);

  const card = useResponsiveCard({
    item: props,
    deriveSharedData: () => sharedData as EntryCardSharedData,
    renderMobile: EntryCardMobile,
    renderDesktop: EntryCardDesktop,
    isMobile: props.isMobile,
  });

  if (!sharedData) return null;

  return card;
};
