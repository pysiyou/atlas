/**
 * FeatureGate Component
 * 
 * Conditionally renders children based on feature flag configuration.
 * Use this to hide/show features based on client configuration.
 */
import React from 'react';
import { isFeatureEnabled } from '@/config/clientConfig';

interface FeatureGateProps {
  /** Feature flag key to check (e.g., 'payments', 'reports', 'laboratory') */
  feature: string;
  /** Content to render when feature is enabled */
  children: React.ReactNode;
  /** Optional fallback content when feature is disabled */
  fallback?: React.ReactNode;
}

/**
 * Conditionally render content based on feature flags
 * 
 * @example
 * <FeatureGate feature="payments">
 *   <PaymentButton />
 * </FeatureGate>
 * 
 * @example
 * <FeatureGate feature="audit" fallback={<div>Audit disabled</div>}>
 *   <AuditLog />
 * </FeatureGate>
 */
export const FeatureGate: React.FC<FeatureGateProps> = ({ 
  feature, 
  children, 
  fallback = null 
}) => {
  const enabled = isFeatureEnabled(feature);
  
  return <>{enabled ? children : fallback}</>;
};

/**
 * Hook to check if a feature is enabled
 * 
 * @example
 * const isPaymentsEnabled = useFeature('payments');
 */
export function useFeature(feature: string): boolean {
  return isFeatureEnabled(feature);
}

/**
 * Hook to check multiple features
 * 
 * @example
 * const { payments, reports } = useFeatures(['payments', 'reports']);
 */
export function useFeatures(features: string[]): Record<string, boolean> {
  return features.reduce((acc, feature) => {
    acc[feature] = isFeatureEnabled(feature);
    return acc;
  }, {} as Record<string, boolean>);
}
