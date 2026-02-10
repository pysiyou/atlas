import React from 'react';
import { Badge, Button, Checkbox } from '@/shared/ui';
import type { AffiliationDuration } from '@/types';
import { AFFILIATION_DURATION_OPTIONS } from '@/types';
import { formatDate } from '@/utils';
import { usePatientService } from '../../services/usePatientService';
import { AffiliationPlanSelector } from '../AffiliationPlanSelector';
import type { PatientFormSectionProps } from './types';

export const AffiliationSection: React.FC<
  Pick<
    PatientFormSectionProps,
    'formData' | 'errors' | 'onFieldChange' | 'existingAffiliation' | 'onRenew'
  >
> = ({ formData, errors, onFieldChange, existingAffiliation, onRenew }) => {
  const { isAffiliationActive } = usePatientService();
  const hasExistingAffiliation = !!existingAffiliation;
  const isActive = isAffiliationActive(existingAffiliation);

  // Handle plan selection from AffiliationPlanSelector
  const handlePlanSelect = (duration: AffiliationDuration) => {
    onFieldChange('hasAffiliation', true);
    onFieldChange('affiliationDuration', duration);
  };

  return (
    <div className="space-y-6">
      {/* Existing Affiliation Info */}
      {hasExistingAffiliation && (
        <div className="bg-panel border border-stroke rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-stroke-subtle">
            <span className="text-sm font-semibold text-fg">Current Affiliation</span>
            <Badge variant={isActive ? 'success' : 'danger'} size="sm" className="font-medium">
              {isActive ? 'Active' : 'Expired'}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs font-medium text-fg-subtle uppercase tracking-wide">
                Assurance Number
              </span>
              <p className="font-mono font-semibold text-fg text-sm">
                {existingAffiliation.assuranceNumber}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-fg-subtle uppercase tracking-wide">
                Duration
              </span>
              <p className="font-semibold text-fg text-sm">
                {AFFILIATION_DURATION_OPTIONS.find(
                  opt => opt.value === existingAffiliation.duration
                )?.label || `${existingAffiliation.duration} Months`}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-fg-subtle uppercase tracking-wide">
                Start Date
              </span>
              <p className="font-semibold text-fg text-sm">
                {formatDate(existingAffiliation.startDate)}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-fg-subtle uppercase tracking-wide">
                Expiry Date
              </span>
              <p className={`font-semibold text-sm ${isActive ? 'text-fg' : 'text-danger-fg'}`}>
                {formatDate(existingAffiliation.endDate)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* New/Renewal Affiliation Toggle */}
      {!hasExistingAffiliation && (
        <div className="p-4 bg-canvas rounded-lg border border-stroke">
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
            <p className="mb-2 text-sm text-danger-fg">{errors.affiliationDuration}</p>
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
        <Button type="button" onClick={onRenew} variant="primary" size="md" fullWidth>
          Renew Affiliation
        </Button>
      )}
    </div>
  );
};
