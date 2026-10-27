/**
 * Modal body placeholders — composed from Panel loading primitives.
 */

import { Panel } from '@/components/surfaces';
import { LAYOUT } from '@/theme/recipes';
import { MODAL_WORKFLOW_BODY_STACK } from './ModalPageShell';

export type ModalLoadingVariant = 'default' | 'workflow' | 'form';

export function ModalLoadingBody({ variant = 'default' }: { variant?: ModalLoadingVariant }) {
  if (variant === 'workflow') {
    return (
      <div className={MODAL_WORKFLOW_BODY_STACK} aria-busy="true" aria-label="Loading">
        <div className={`grid grid-cols-1 md:grid-cols-2 ${LAYOUT.balancedColumns}`}>
          <Panel preset="panel.pageEmbed.visible" title="Details" loading loadingShape="fields" loadingRows={5} />
          <Panel preset="panel.pageEmbed.visible" title="Details" loading loadingShape="fields" loadingRows={5} />
        </div>
        <Panel preset="panel.compact.standard" title="Activity" loading loadingShape="list" loadingRows={4} />
      </div>
    );
  }

  if (variant === 'form') {
    return (
      <div className="space-y-space-6 max-w-full" aria-busy="true" aria-label="Loading form">
        <Panel preset="panel.pageEmbed.visible" title="Patient" loading loadingShape="fields" loadingRows={3} />
        <Panel preset="panel.pageEmbed.visible" title="Tests" loading loadingShape="table" loadingTableColumns={4} loadingTableRows={3} />
        <Panel preset="panel.pageEmbed.visible" title="Order details" loading loadingShape="fields" loadingRows={4} />
      </div>
    );
  }

  return (
    <div className="space-y-space-5" aria-busy="true" aria-label="Loading">
      <Panel preset="panel.pageEmbed.visible" title="Loading" loading loadingShape="fields" loadingRows={4} />
      <Panel preset="panel.pageEmbed.visible" loading loadingShape="block" />
    </div>
  );
}
