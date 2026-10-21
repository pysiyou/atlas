import React, { useCallback } from 'react';
import { useWatch } from 'react-hook-form';
import { Badge, Button, Checkbox } from '@/components/primitives';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import type { AffiliationDuration } from '@/types';
import { AFFILIATION_DURATION_OPTIONS } from '@/types';
import { formatDate } from '@/utils';
import { text, FORM_FIELD_LABEL, FG } from '@/theme/recipes';
import { isAffiliationActive } from '../utils/patientHelpers';
import { AffiliationPlanSelector } from './AffiliationPlanSelector';
import { FIELD_ERROR, RADIUS, SHADOW, SURFACE, TONE } from '@/theme/recipes';
import type { PatientAffiliationSectionProps } from '../patientFormTypes';
import { patientFieldError } from '../patientFormFieldError';

export const AffiliationSection: React.FC<PatientAffiliationSectionProps> = ({
  control,
  errors,
  setValue,
  existingAffiliation,
  affiliationEnabled,
  onAffiliationEnabledChange,
  onRenew,
}) => {
  const affiliation = useWatch({ control, name: 'affiliation' });
  const duration = affiliation?.duration ?? undefined;

  const renewHandler = useCallback(
    async (_signal: AbortSignal) => {
      await Promise.resolve(onRenew?.());
    },
    [onRenew],
  );
  const { execute: handleRenew, isPending: isRenewing } = useAsyncAction(renewHandler, {
    minDisplayMs: 100,
  });
  const hasExistingAffiliation = !!existingAffiliation;
  const isActive = isAffiliationActive(existingAffiliation);

  const handlePlanSelect = (selectedDuration: AffiliationDuration) => {
    onAffiliationEnabledChange(true);
    setValue(
      'affiliation',
      { ...(affiliation ?? {}), duration: selectedDuration },
      { shouldValidate: true, shouldDirty: true },
    );
  };

  const showPlanSelector =
    affiliationEnabled || (hasExistingAffiliation && !isActive) || !!duration;

  const durationError = patientFieldError(errors, 'affiliation.duration');

  return (
    <div className="space-y-space-6">
      {hasExistingAffiliation && (
        <div
          className={`${SURFACE.raised} ${RADIUS.menu} p-space-5 space-y-space-4 ${SHADOW.subtle}`}
        >
          <div className="flex items-center justify-between pb-space-3 border-b border-border-subtle">
            <span className={text({ role: 'amount' })}>Current Affiliation</span>
            <Badge variant={isActive ? 'success' : 'danger'} size="xs" className="font-normal">
              {isActive ? 'Active' : 'Expired'}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-layout-section">
            <div className="space-y-space-1">
              <span className={FORM_FIELD_LABEL}>Assurance Number</span>
              <p className={text({ role: 'amount' })}>{existingAffiliation.assuranceNumber}</p>
            </div>
            <div className="space-y-space-1">
              <span className={FORM_FIELD_LABEL}>Duration</span>
              <p className={text({ role: 'amount' })}>
                {AFFILIATION_DURATION_OPTIONS.find(opt => opt.value === existingAffiliation.duration)
                  ?.label || `${existingAffiliation.duration} Months`}
              </p>
            </div>
            <div className="space-y-space-1">
              <span className={FORM_FIELD_LABEL}>Start Date</span>
              <p className={text({ role: 'amount' })}>{formatDate(existingAffiliation.startDate)}</p>
            </div>
            <div className="space-y-space-1">
              <span className={FORM_FIELD_LABEL}>Expiry Date</span>
              <p
                className={`font-normal ${text({ role: 'amount' })} ${isActive ? FG.body : TONE.danger.fg}`}
              >
                {formatDate(existingAffiliation.endDate)}
              </p>
            </div>
          </div>
        </div>
      )}

      {!hasExistingAffiliation && (
        <div className={`p-panel ${SURFACE.recessed} ${RADIUS.menu}`}>
          <Checkbox
            id="hasAffiliation"
            name="hasAffiliation"
            checked={affiliationEnabled || !!duration}
            onChange={v => {
              onAffiliationEnabledChange(v);
              if (!v) {
                setValue('affiliation', undefined, { shouldValidate: true, shouldDirty: true });
              }
            }}
            label="Subscribe to lab affiliation"
          />
        </div>
      )}

      {showPlanSelector && (
        <div>
          {durationError && <p className={`mb-space-2 ${FIELD_ERROR}`}>{durationError}</p>}
          <AffiliationPlanSelector
            selectedDuration={duration as AffiliationDuration | undefined}
            onDurationSelect={handlePlanSelect}
            hasExistingAffiliation={hasExistingAffiliation}
            isActive={isActive}
            actionLabel={hasExistingAffiliation ? (isActive ? 'Extend' : 'Renew') : 'Continue'}
          />
        </div>
      )}

      {hasExistingAffiliation && !isActive && !affiliationEnabled && !duration && onRenew && (
        <Button
          type="button"
          onClick={handleRenew}
          variant="primary"
          size="md"
          fullWidth
          disabled={isRenewing}
          isLoading={isRenewing}
        >
          {isRenewing ? 'Renewing...' : 'Renew Affiliation'}
        </Button>
      )}
    </div>
  );
};
