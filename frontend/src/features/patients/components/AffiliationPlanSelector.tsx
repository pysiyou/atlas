/**
 * Affiliation Plan Selector Component
 * Subscription-style UI for selecting affiliation plans (6, 12, 24 months)
 * Inspired by modern subscription plan selection patterns
 */

import React, { useMemo } from 'react';
import { Button, Icon, SelectableCard } from '@/components/primitives';
import { Callout } from '@/components/display';
import { SpinnerLoader } from '@/components/feedback';
import { useAffiliationPricing } from '@/features/catalog';
import { formatCurrency } from '@/utils';
import { getFeedback } from '@/utils/feedback';
import { AFFILIATION_DURATION_OPTIONS } from '@/types';
import type { AffiliationPlan } from '@/types/affiliation';
import type { AffiliationDuration } from '@/types';
import { ICONS } from '@/config/icons';
import { Text } from '@/components/layout/Text';
import { text, RADIUS, SHADOW } from '@/theme/recipes';


export interface AffiliationPlanSelectorProps {
  /** Currently selected duration */
  selectedDuration?: AffiliationDuration;
  /** Callback when duration is selected */
  onDurationSelect: (duration: AffiliationDuration) => void;
  /** Whether user has existing affiliation */
  hasExistingAffiliation?: boolean;
  /** Whether existing affiliation is active */
  isActive?: boolean;
  /** Action label for the button (e.g., "Continue", "Renew", "Extend") */
  actionLabel?: string;
  /** Whether to show loading state */
  loading?: boolean;
  /** Optional callback when action button is clicked */
  onAction?: () => void;
}

/**
 * Affiliation Plan Selector Component
 * Displays subscription-style plan selection with pricing
 */
// Large component is necessary for subscription-style plan selector with pricing display, plan cards, and comprehensive UI
// eslint-disable-next-line max-lines-per-function
export const AffiliationPlanSelector: React.FC<AffiliationPlanSelectorProps> = ({
  selectedDuration,
  onDurationSelect,
  hasExistingAffiliation = false,
  isActive = false,
  actionLabel = 'Continue',
  loading = false,
  onAction,
}) => {
  // Use TanStack Query for pricing data with static caching
  const { pricing, isLoading: isLoadingPricing, isError } = useAffiliationPricing();
  const error = isError ? getFeedback('patients.affiliation.pricingLoadFailed').title : null;

  // Build plans with pricing information
  const plans: AffiliationPlan[] = useMemo(() => {
    return AFFILIATION_DURATION_OPTIONS.map(option => {
      const pricingData = pricing.find(p => p.duration === option.value);
      const price = pricingData?.price ?? 0;
      const monthlyPrice = price / option.value;

      // Mark 12 months as "Best Value"
      const isBestValue = option.value === 12;

      return {
        duration: option.value,
        label: option.label,
        price,
        monthlyPrice,
        isBestValue,
      };
    });
  }, [pricing]);

  // Determine action text based on context
  const getActionText = (): string => {
    if (hasExistingAffiliation) {
      return isActive ? 'Extend Affiliation' : 'Renew Affiliation';
    }
    return actionLabel;
  };

  // Handle plan selection
  const handlePlanSelect = (duration: AffiliationDuration) => {
    onDurationSelect(duration);
  };

  if (isLoadingPricing) {
    return (
      <div className="flex items-center justify-center py-space-8">
        <SpinnerLoader size="md" />
        <Text role="amount" intent="muted" className="ml-space-3">Loading plans...</Text>
      </div>
    );
  }

  // Show error warning but still allow plan selection
  const showPricingError = error && pricing.length === 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-8">
      {/* Left Column - Text/Information */}
      <div className="space-y-space-6">
        {showPricingError && (
          <Callout variant="warning" title={error} className="mb-space-4">
            You can still select a plan. Pricing will be calculated during checkout.
          </Callout>
        )}
        <div className="space-y-space-4">
          <div>
            <Text as="h3" role="title-section" className="mb-space-2">Lab Affiliation Benefits</Text>
            <Text as="p" role="amount" intent="muted" className="leading-relaxed">
              Choose a plan that fits your needs. All plans include priority services and discounted
              pricing for lab tests.
            </Text>
          </div>

          {/* Included Features - icons follow theme (brand) */}
          <div className="space-y-space-3">
            <Text as="h4" role="section-title">What&apos;s Included</Text>
            <div className="space-y-space-2-5">
              <div className="flex items-start gap-space-3">
                <div className={`flex-shrink-0 w-4 h-4 ${RADIUS.pill} bg-brand flex items-center justify-center mt-space-0-5`}>
                  <Icon name={ICONS.actions.check} className="w-3 h-3 text-on-brand" />
                </div>
                <div>
                  <Text role="amount">Priority Lab Services</Text>
                  <Text as="p" role="caption" intent="muted" className="mt-space-0-5">Faster processing and results</Text>
                </div>
              </div>
              <div className="flex items-start gap-space-3">
                <div className={`flex-shrink-0 w-4 h-4 ${RADIUS.pill} bg-brand flex items-center justify-center mt-space-0-5`}>
                  <Icon name={ICONS.actions.check} className="w-3 h-3 text-on-brand" />
                </div>
                <div>
                  <Text role="amount">Discounted Test Pricing</Text>
                  <Text as="p" role="caption" intent="muted" className="mt-space-0-5">Save on all lab tests</Text>
                </div>
              </div>
              <div className="flex items-start gap-space-3">
                <div className={`flex-shrink-0 w-4 h-4 ${RADIUS.pill} bg-brand flex items-center justify-center mt-space-0-5`}>
                  <Icon name={ICONS.actions.check} className="w-3 h-3 text-on-brand" />
                </div>
                <div>
                  <Text role="amount">Assurance Number</Text>
                  <Text as="p" role="caption" intent="muted" className="mt-space-0-5">
                    Auto-generated unique identifier
                  </Text>
                </div>
              </div>
              <div className="flex items-start gap-space-3">
                <div className={`flex-shrink-0 w-4 h-4 ${RADIUS.pill} bg-brand flex items-center justify-center mt-space-0-5`}>
                  <Icon name={ICONS.actions.check} className="w-3 h-3 text-on-brand" />
                </div>
                <div>
                  <Text role="amount">Extended Validity Period</Text>
                  <Text as="p" role="caption" intent="muted" className="mt-space-0-5">Long-term access to services</Text>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="pt-space-4 border-t border-border-default">
            <Text as="p" role="body" intent="muted" className="leading-relaxed">
              {hasExistingAffiliation
                ? 'Your affiliation will be extended from the current end date when you renew or extend.'
                : 'An assurance number will be automatically generated upon registration. All plans include full lab services access.'}
            </Text>
          </div>
        </div>
      </div>

      {/* Right Column - Plan Cards */}
      <div className="space-y-space-4">
        <div className="space-y-space-3">
          {plans.map(plan => {
            const isSelected = selectedDuration === plan.duration;
            const hasPrice = plan.price > 0;

            return (
              <SelectableCard
                key={plan.duration}
                selected={isSelected}
                emphasis={plan.isBestValue ? 'featured' : 'default'}
                onSelect={() => handlePlanSelect(plan.duration)}
              >
                {/* Best Value Badge */}
                {plan.isBestValue && (
                  <div className="absolute -top-space-2 -right-space-2">
                    <div className={`bg-danger text-on-danger ${text({ role: 'caption' })} font-normal px-space-2 py-space-0-5 ${RADIUS.surface} transform rotate-3 ${SHADOW.subtle}`}>
                      Best Value
                    </div>
                  </div>
                )}

                {/* Circular single-select indicator - theme matches Checkbox (brand, border-border-default) */}
                <div className="flex items-start gap-layout-section">
                  <div className="mt-space-0-5 flex-shrink-0">
                    <div
                      className={`
                        w-4 h-4 ${RADIUS.pill} border-2 flex items-center justify-center transition-all duration-150
                        ${
                          isSelected
                            ? 'border-brand bg-brand'
                            : 'border-border-default bg-surface group-hover:border-brand'
                        }
                      `}
                    >
                      {isSelected && (
                        <Icon name={ICONS.actions.check} className="w-3 h-3 text-on-brand" />
                      )}
                    </div>
                  </div>

                  {/* Plan Details */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-space-2">
                      <Text as="h5" role="title-section">{plan.label}</Text>
                    </div>

                    {/* Pricing */}
                    {hasPrice ? (
                      <div className="space-y-space-0-5">
                        {plan.duration === 12 ? (
                          <>
                            <div className="flex items-baseline gap-space-2">
                              <span className={`${text({ role: 'title-page' })} font-normal`}>
                                {formatCurrency(plan.monthlyPrice)}
                              </span>
                              <Text role="amount" intent="muted" className="font-normal">/month</Text>
                            </div>
                            <Text role="body" intent="muted">
                              {formatCurrency(plan.price)} per year
                            </Text>
                          </>
                        ) : (
                          <div className="flex items-baseline gap-space-2">
                            <span className={`${text({ role: 'title-page' })} font-normal`}>
                              {formatCurrency(plan.price)}
                            </span>
                            <Text role="amount" intent="muted">
                              /{plan.duration === 6 ? '6 months' : '2 years'}
                            </Text>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-space-1">
                        <Text role="amount" intent="muted">Price not available</Text>
                        {isSelected && (
                          <Text role="body" className="text-warning-fg">
                            Pricing will be calculated during checkout
                          </Text>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </SelectableCard>
            );
          })}
        </div>

        {/* Action Button - Only show when onAction is provided */}
        {selectedDuration && onAction && (
          <div className="pt-space-4">
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              onClick={onAction}
              disabled={loading}
              isLoading={loading}
            >
              {getActionText()}
            </Button>
            <p className={`${text({ role: 'body', intent: 'muted' })} text-center mt-space-2`}>
              All subscription auto renews until canceled
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
