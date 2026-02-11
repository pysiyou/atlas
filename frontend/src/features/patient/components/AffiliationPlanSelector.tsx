/**
 * Affiliation Plan Selector Component
 * Subscription-style UI for selecting affiliation plans (6, 12, 24 months)
 * Inspired by modern subscription plan selection patterns
 */

import React, { useMemo } from 'react';
import { Button, CalloutCard, Icon } from '@/shared/ui';
import { ClaudeLoader } from '@/shared/ui';
import { useAffiliationPricing } from '@/hooks/queries/useAffiliationPricing';
import { formatCurrency } from '@/utils';
import { AFFILIATION_DURATION_OPTIONS } from '@/types';
import type { AffiliationPlan } from '@/types/affiliation';
import type { AffiliationDuration } from '@/types';
import { ICONS } from '@/utils';

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
  const error = isError ? 'Failed to load pricing. Please try again.' : null;

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
      <div className="flex items-center justify-center py-8">
        <ClaudeLoader size="md" />
        <span className="ml-3 text-sm text-text-tertiary">Loading plans...</span>
      </div>
    );
  }

  // Show error warning but still allow plan selection
  const showPricingError = error && pricing.length === 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column - Text/Information */}
      <div className="space-y-6">
        {showPricingError && (
          <CalloutCard variant="warning" title={error} className="mb-4">
            You can still select a plan. Pricing will be calculated during checkout.
          </CalloutCard>
        )}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Lab Affiliation Benefits</h3>
            <p className="text-sm text-text-tertiary leading-relaxed">
              Choose a plan that fits your needs. All plans include priority services and discounted
              pricing for lab tests.
            </p>
          </div>

          {/* Included Features - icons follow theme (brand) */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-text-primary">What's Included</h4>
            <div className="space-y-2.5">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-4 h-4 rounded-full bg-brand flex items-center justify-center mt-0.5">
                  <Icon name={ICONS.actions.check} className="w-3 h-3 text-on-brand" />
                </div>
                <div>
                  <span className="text-sm font-normal text-text-primary">Priority Lab Services</span>
                  <p className="text-xs text-text-tertiary mt-0.5">Faster processing and results</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-4 h-4 rounded-full bg-brand flex items-center justify-center mt-0.5">
                  <Icon name={ICONS.actions.check} className="w-3 h-3 text-on-brand" />
                </div>
                <div>
                  <span className="text-sm font-normal text-text-primary">Discounted Test Pricing</span>
                  <p className="text-xs text-text-tertiary mt-0.5">Save on all lab tests</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-4 h-4 rounded-full bg-brand flex items-center justify-center mt-0.5">
                  <Icon name={ICONS.actions.check} className="w-3 h-3 text-on-brand" />
                </div>
                <div>
                  <span className="text-sm font-normal text-text-primary">Assurance Number</span>
                  <p className="text-xs text-text-tertiary mt-0.5">Auto-generated unique identifier</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-4 h-4 rounded-full bg-brand flex items-center justify-center mt-0.5">
                  <Icon name={ICONS.actions.check} className="w-3 h-3 text-on-brand" />
                </div>
                <div>
                  <span className="text-sm font-normal text-text-primary">
                    Extended Validity Period
                  </span>
                  <p className="text-xs text-text-tertiary mt-0.5">Long-term access to services</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="pt-4 border-t border-border-default">
            <p className="text-xs text-text-tertiary leading-relaxed">
              {hasExistingAffiliation
                ? 'Your affiliation will be extended from the current end date when you renew or extend.'
                : 'An assurance number will be automatically generated upon registration. All plans include full lab services access.'}
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - Plan Cards */}
      <div className="space-y-4">
        <div className="space-y-3">
          {plans.map(plan => {
            const isSelected = selectedDuration === plan.duration;
            const hasPrice = plan.price > 0;

            return (
              <div
                key={plan.duration}
                onClick={() => handlePlanSelect(plan.duration)}
                className={`
                  group relative border-2 rounded-xl p-5 cursor-pointer transition-all duration-200
                  ${
                    isSelected
                      ? 'border-brand bg-brand-muted shadow-sm'
                      : 'border-border-default hover:border-border-strong bg-surface hover:shadow-sm'
                  }
                `}
              >
                {/* Best Value Badge */}
                {plan.isBestValue && (
                  <div className="absolute -top-2 -right-2">
                    <div className="bg-danger text-on-danger text-[10px] font-normal px-2 py-0.5 rounded-md transform rotate-3 shadow-sm">
                      Best Value
                    </div>
                  </div>
                )}

                {/* Circular single-select indicator - theme matches Checkbox (brand, border-border-default) */}
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 flex-shrink-0">
                    <div
                      className={`
                        w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-150
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
                    <div className="mb-2">
                      <h5 className="font-semibold text-text-primary text-base">{plan.label}</h5>
                    </div>

                    {/* Pricing */}
                    {hasPrice ? (
                      <div className="space-y-0.5">
                        {plan.duration === 12 ? (
                          <>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-normal text-text-primary">
                                {formatCurrency(plan.monthlyPrice)}
                              </span>
                              <span className="text-sm text-text-tertiary font-normal">/month</span>
                            </div>
                            <div className="text-xs text-text-tertiary">
                              {formatCurrency(plan.price)} per year
                            </div>
                          </>
                        ) : (
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-normal text-text-primary">
                              {formatCurrency(plan.price)}
                            </span>
                            <span className="text-sm text-text-tertiary">
                              /{plan.duration === 6 ? '6 months' : '2 years'}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-sm text-text-tertiary">Price not available</div>
                        {isSelected && (
                          <div className="text-xs text-warning-text">Pricing will be calculated during checkout</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button - Only show when onAction is provided */}
        {selectedDuration && onAction && (
          <div className="pt-4">
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              onClick={onAction}
              disabled={loading}
              className="font-normal bg-brand hover:bg-brand-hover text-on-brand rounded-lg py-3 text-base shadow-sm"
            >
              {loading ? 'Processing...' : getActionText()}
            </Button>
            <p className="text-xs text-text-tertiary text-center mt-2">
              All subscription auto renews until canceled
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
