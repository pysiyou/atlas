/**
 * Critical Value Banner — inline banner for critical values (auto-notified on approval).
 */

import { Alert } from '@/components/display';

import { Icon } from '@/components/primitives';
import { IconKeys } from '@/icons';
import { text, FIELD_ERROR, TONE } from '@/theme/recipes';


export interface CriticalValueBannerProps {
  /** Analyte result lines flagged critical */
  criticalResults: Array<{
    name: string;
    value: string | number;
    unit?: string;
  }>;
  /** Optional CSS classes */
  className?: string;
}

/**
 * Shows which values are critical without requiring explicit acknowledgment.
 */
export function ResultCriticalValueBanner({
  criticalResults,
  className,
}: CriticalValueBannerProps) {
  if (criticalResults.length === 0) {
    return null;
  }

  return (
    <Alert variant="danger" className={className}>
      <div className="space-y-space-2">
        <div className="flex items-center gap-space-2">
          <Icon iconKey={IconKeys.actions.alertCircle} className="w-4 h-4" />
          <h4 className={`${FIELD_ERROR}`}>
            Contains Critical Values
          </h4>
        </div>
        <div className="pl-space-6 space-y-space-1">
          {criticalResults.map((result, index) => (
            <div key={index} className={`flex items-baseline gap-space-2 ${text({ role: 'body' })}`}>
              <span className={`shrink-0 font-medium ${TONE.danger.fg}`}>{result.name}</span>
              <span className={`font-normal ${TONE.danger.fg}`}>
                {result.value}
                {result.unit && <span className={`ml-space-1 ${text({ role: 'caption' })}`}>{result.unit}</span>}
              </span>
            </div>
          ))}
        </div>
        <p className={`${text({ role: 'caption' })} pl-space-6`}>
          Confirm you have seen this result before approving.
        </p>
      </div>
    </Alert>
  );
}
