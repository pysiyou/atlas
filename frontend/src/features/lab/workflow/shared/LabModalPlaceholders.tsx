/**
 * Lab workflow modal body placeholders — one skeleton layout per modal type.
 */

import { Panel } from '@/components/surfaces';
import { LAYOUT } from '@/theme/recipes';
import { MODAL_WORKFLOW_BODY_STACK } from '@/components/overlays/ModalPageShell';
import { LabResultsTableSkeleton } from '../../components/LabResultsTableSkeleton';

export type LabModalPlaceholderVariant =
  | 'testDetailView'
  | 'testDetailValidate'
  | 'resultEntry'
  | 'escalation'
  | 'sampleCollection';

const PLACEHOLDER_ARIA_LABEL: Record<LabModalPlaceholderVariant, string> = {
  testDetailView: 'Test details',
  testDetailValidate: 'Validation review',
  resultEntry: 'Result entry',
  escalation: 'Escalation review',
  sampleCollection: 'Sample collection',
};

export function LabModalPlaceholder({ variant }: { variant: LabModalPlaceholderVariant }) {
  const stackClass = MODAL_WORKFLOW_BODY_STACK;

  if (variant === 'resultEntry') {
    return (
      <div className={stackClass} aria-busy="true" aria-label={PLACEHOLDER_ARIA_LABEL[variant]}>
        <Panel
          preset="panel.compact.standard"
          title="Result Entry"
          loading
        />
        <Panel
          preset="panel.pageEmbed.visible"
          title="Related tests"
          loading
        />
        <div className={`grid grid-cols-1 md:grid-cols-2 ${LAYOUT.balancedColumns}`}>
          <Panel preset="panel.pageEmbed.visible" title="Order" loading />
          <Panel preset="panel.pageEmbed.visible" title="Sample" loading />
        </div>
        <Panel preset="panel.compact.standard" title="Activity" loading />
      </div>
    );
  }

  if (variant === 'escalation') {
    return (
      <div className={stackClass} aria-busy="true" aria-label={PLACEHOLDER_ARIA_LABEL[variant]}>
        <Panel preset="panel.compact.scrollAuto.maxH" title="Recorded Results">
          <LabResultsTableSkeleton />
        </Panel>
        <Panel
          preset="panel.compact.standard"
          title="Resolution"
          loading
        />
        <Panel
          preset="panel.pageEmbed.visible"
          title="Related tests"
          loading
        />
        <Panel preset="panel.compact.standard" title="Activity" loading />
      </div>
    );
  }

  if (variant === 'sampleCollection') {
    return (
      <div className={stackClass} aria-busy="true" aria-label={PLACEHOLDER_ARIA_LABEL[variant]}>
        <div className={`grid grid-cols-1 md:grid-cols-2 ${LAYOUT.balancedColumns}`}>
          <Panel preset="panel.pageEmbed.visible" title="Sample" loading />
          <Panel preset="panel.pageEmbed.visible" title="Collection" loading />
        </div>
        <Panel preset="panel.pageEmbed.visible" title="Tests on sample" loading />
        <Panel
          preset="panel.pageEmbed.visible"
          title="Related samples"
          loading
        />
        <Panel preset="panel.compact.standard" title="Activity" loading />
      </div>
    );
  }

  const resultsTitle = variant === 'testDetailValidate' ? 'Result Validation' : 'Recorded Results';
  return (
    <div className={stackClass} aria-busy="true" aria-label={PLACEHOLDER_ARIA_LABEL[variant]}>
      <Panel preset="panel.compact.scrollAuto.maxH" title={resultsTitle}>
        <LabResultsTableSkeleton />
      </Panel>
      {variant === 'testDetailValidate' ? (
        <Panel
          preset="panel.compact.standard"
          title="Critical Value Notification"
          loading
        />
      ) : null}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${LAYOUT.balancedColumns}`}>
        <Panel preset="panel.pageEmbed.visible" title="Order" loading />
        <Panel preset="panel.pageEmbed.visible" title="Sample" loading />
      </div>
      <Panel
        preset="panel.pageEmbed.visible"
        title="Related tests"
        loading
      />
      <Panel preset="panel.compact.standard" title="Activity" loading />
    </div>
  );
}
