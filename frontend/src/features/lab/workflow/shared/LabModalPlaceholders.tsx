/**
 * Lab workflow modal body placeholders — one skeleton layout per modal type.
 */

import { Panel } from '@/components/surfaces';
import { LAYOUT } from '@/theme/recipes';
import { MODAL_WORKFLOW_BODY_STACK } from '@/components/overlays/ModalPageShell';
import { useLabCopy, useModuleListTitles, usePanelCopy } from '@/strings';
import { LabResultsTableSkeleton } from '../../components/LabResultsTableSkeleton';

export type LabModalPlaceholderVariant =
  | 'testDetailView'
  | 'testDetailValidate'
  | 'resultEntry'
  | 'escalation'
  | 'sampleCollection';

export function LabModalPlaceholder({ variant }: { variant: LabModalPlaceholderVariant }) {
  const titles = useModuleListTitles();
  const activityTitle = titles.activity;
  const labCopy = useLabCopy();
  const panels = usePanelCopy();
  const placeholderAriaLabel: Record<LabModalPlaceholderVariant, string> = {
    testDetailView: labCopy.panels.placeholderTestDetails,
    testDetailValidate: labCopy.panels.placeholderValidationReview,
    resultEntry: labCopy.panels.placeholderResultEntry,
    escalation: labCopy.panels.placeholderEscalation,
    sampleCollection: labCopy.panels.placeholderSampleCollection,
  };
  const stackClass = MODAL_WORKFLOW_BODY_STACK;

  if (variant === 'resultEntry') {
    return (
      <div className={stackClass} aria-busy="true" aria-label={placeholderAriaLabel[variant]}>
        <Panel
          preset="panel.compact.standard"
          title={labCopy.workflow.entry}
          loading
        />
        <Panel
          preset="panel.pageEmbed.visible"
          title={panels.shared.relatedTests}
          loading
        />
        <div className={`grid grid-cols-1 md:grid-cols-2 ${LAYOUT.balancedColumns}`}>
          <Panel preset="panel.pageEmbed.visible" title={titles.orderDetail} loading />
          <Panel preset="panel.pageEmbed.visible" title={labCopy.entity.sample} loading />
        </div>
        <Panel preset="panel.compact.standard" title={activityTitle} loading />
      </div>
    );
  }

  if (variant === 'escalation') {
    return (
      <div className={stackClass} aria-busy="true" aria-label={placeholderAriaLabel[variant]}>
        <Panel preset="panel.compact.scrollAuto.maxH" title={labCopy.panels.recordedResults}>
          <LabResultsTableSkeleton />
        </Panel>
        <Panel
          preset="panel.compact.standard"
          title={labCopy.panels.resolution}
          loading
        />
        <Panel
          preset="panel.pageEmbed.visible"
          title={panels.shared.relatedTests}
          loading
        />
        <Panel preset="panel.compact.standard" title={activityTitle} loading />
      </div>
    );
  }

  if (variant === 'sampleCollection') {
    return (
      <div className={stackClass} aria-busy="true" aria-label={placeholderAriaLabel[variant]}>
        <div className={`grid grid-cols-1 md:grid-cols-2 ${LAYOUT.balancedColumns}`}>
          <Panel preset="panel.pageEmbed.visible" title={labCopy.entity.sample} loading />
          <Panel preset="panel.pageEmbed.visible" title={labCopy.workflow.collection} loading />
        </div>
        <Panel preset="panel.pageEmbed.visible" title={labCopy.panels.testsOnSample} loading />
        <Panel
          preset="panel.pageEmbed.visible"
          title={panels.shared.relatedSamples}
          loading
        />
        <Panel preset="panel.compact.standard" title={activityTitle} loading />
      </div>
    );
  }

  const resultsTitle =
    variant === 'testDetailValidate' ? labCopy.panels.resultValidation : labCopy.panels.recordedResults;
  return (
    <div className={stackClass} aria-busy="true" aria-label={placeholderAriaLabel[variant]}>
      <Panel preset="panel.compact.scrollAuto.maxH" title={resultsTitle}>
        <LabResultsTableSkeleton />
      </Panel>
      {variant === 'testDetailValidate' ? (
        <Panel
          preset="panel.compact.standard"
          title={labCopy.panels.criticalValueNotification}
          loading
        />
      ) : null}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${LAYOUT.balancedColumns}`}>
        <Panel preset="panel.pageEmbed.visible" title={titles.orderDetail} loading />
        <Panel preset="panel.pageEmbed.visible" title={labCopy.entity.sample} loading />
      </div>
      <Panel
        preset="panel.pageEmbed.visible"
        title={panels.shared.relatedTests}
        loading
      />
      <Panel preset="panel.compact.standard" title={activityTitle} loading />
    </div>
  );
}
