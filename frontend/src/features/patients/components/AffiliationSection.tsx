import React, { useCallback } from 'react';
import { Badge, Button, Checkbox } from '@/components';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import type { AffiliationDuration } from '@/types';
import { AFFILIATION_DURATION_OPTIONS } from '@/types';
import { formatDate } from '@/utils';
import { FORM_FIELD_LABEL } from '@/components/inputs/inputStyles';
import { isAffiliationActive } from '../utils/patientHelpers';
import { AffiliationPlanSelector } from './AffiliationPlanSelector';
import { SURFACE, TONE, RADIUS } from '@/components/theme/recipes';
import type { PatientFormSectionProps } from '../patientFormTypes';

export const AffiliationSection: React.FC<
  Pick<
    PatientFormSectionProps,
    'formData' | 'errors' | 'onFieldChange' | 'existingAffiliation' | 'onRenew'
  >
> = ({ formData, errors, onFieldChange, existingAffiliation, onRenew }) => {
  const renewHandler = useCallback(
    async (_signal: AbortSignal) => {
      await Promise.resolve(onRenew?.());
    },
    [onRenew]
  );
  const { execute: handleRenew, isPending: isRenewing } = useAsyncAction(renewHandler, {
    minDisplayMs: 100,
  });
  const hasExistingAffiliation = !!existingAffiliation;
  const isActive = isAffiliationActive(existingAffiliation);

  // Handle plan selection from AffiliationPlanSelector
  const handlePlanSelect = (duration: AffiliationDuration) => {
    onFieldChange('hasAffiliation', true);
    onFieldChange('affiliationDuration', duration);
  };

  return (
    <div className="space-y-space-6">
      {/* Existing Affiliation Info */}
      {hasExistingAffiliation && (
        <div className={`${SURFACE.raised} ${RADIUS.overlay} p-space-5 space-y-space-4 shadow-sm`}>
          <div className="flex items-center justify-between pb-space-3 border-b border-border-subtle">
            <span className="text-sm font-normal text-text-primary">Current Affiliation</span>
            <Badge variant={isActive ? 'success' : 'danger'} size="xs" className="font-normal">
              {isActive ? 'Active' : 'Expired'}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-layout-section">
            <div className="space-y-space-1">
              <span className={FORM_FIELD_LABEL}>
                Assurance Number
              </span>
              <p className="font-normal text-text-primary text-sm">
                {existingAffiliation.assuranceNumber}
              </p>
            </div>
            <div className="space-y-space-1">
              <span className={FORM_FIELD_LABEL}>
                Duration
              </span>
              <p className="font-normal text-text-primary text-sm">
                {AFFILIATION_DURATION_OPTIONS.find(
                  opt => opt.value === existingAffiliation.duration
                )?.label || `${existingAffiliation.duration} Months`}
              </p>
            </div>
            <div className="space-y-space-1">
              <span className={FORM_FIELD_LABEL}>
                Start Date
              </span>
              <p className="font-normal text-text-primary text-sm">
                {formatDate(existingAffiliation.startDate)}
              </p>
            </div>
            <div className="space-y-space-1">
              <span className={FORM_FIELD_LABEL}>
                Expiry Date
              </span>
              <p
                className={`font-normal text-sm ${isActive ? 'text-text-primary' : TONE.danger.fg}`}
              >
                {formatDate(existingAffiliation.endDate)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* New/Renewal Affiliation Toggle */}
      {!hasExistingAffiliation && (
        <div className={`p-panel ${SURFACE.recessed} ${RADIUS.overlay}`}>
          <Checkbox
            id="hasAffiliation"
            name="hasAffiliation"
            checked={formData.hasAffiliation}
            onChange={v => {
              onFieldChange('hasAffiliation', v);
              if (!v) onFieldChange('affiliationDuration', undefined);
            }}
            label="Subscribe to lab affiliation"
          />
        </div>
      )}

      {/* Plan Selector - Show when user wants affiliation (new or extending) */}
      {(formData.hasAffiliation || (hasExistingAffiliation && !isActive)) && (
        <div>
          {errors?.affiliationDuration && (
            <p className={`mb-space-2 text-sm ${TONE.danger.fg}`}>{errors.affiliationDuration}</p>
          )}
          <AffiliationPlanSelector
            selectedDuration={formData.affiliationDuration}
            onDurationSelect={handlePlanSelect}
            hasExistingAffiliation={hasExistingAffiliation}
            isActive={isActive}
            actionLabel={hasExistingAffiliation ? (isActive ? 'Extend' : 'Renew') : 'Continue'}
          />
        </div>
      )}

      {/* Show renew button for expired affiliations if not already showing plan selector */}
      {hasExistingAffiliation && !isActive && !formData.hasAffiliation && onRenew && (
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
