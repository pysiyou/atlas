/**
 * EntryCardDesktop - Desktop layout for result entry workflow
 */

import React from 'react';
import { Badge } from '@/components';
import { LabCard, ProgressBadge } from '../../components/LabCard';
import { TestHeaderBadges } from '../../components/labWorkflowBadges';
import { testHeaderAudit } from '../../components/labHeader';
import { LAB_CONFIG } from '../../constants';
import { LAB_CARD_TYPOGRAPHY } from '../../utils/labStyles';
import type { EntryCardSharedData } from './hooks';

export const EntryCardDesktop: React.FC<EntryCardSharedData> = ({
  test,
  testDef,
  results,
  isComplete,
  parameterCount,
  filledCount,
  handleCardClick,
  workItem,
  rejection,
}) => {
  const { showAttemptIndicator } = rejection;

  const badges = (
    <TestHeaderBadges
      test={test}
      variant="entry"
      queueSince={test.collectedAt}
      blockedLabel={workItem.blockedReason ? workItem.label : undefined}
    />
  );

  const actions = (
    <ProgressBadge
      count={filledCount}
      total={parameterCount}
      label="PARAMS"
      isComplete={isComplete}
    />
  );

  const content = (
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
  );

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
      badges={badges}
      actions={actions}
      content={content}
      contentTitle={`Parameters (${parameterCount})`}
    />
  );
};
