/**
 * Shared lab worklist → UI context projection (gates, presentation, attention).
 */

import type { WorklistActionGateFields, WorklistAttentionFields } from '@/types/labWorklist';

export type WorklistLabProjection = WorklistActionGateFields & WorklistAttentionFields;

type LabProjectionSource = WorklistLabProjection & {
  allowedActions?: WorklistActionGateFields['allowedActions'];
};

/** Copy worklist meta fields into the nested `lab` object on queue row contexts. */
export function copyWorklistLabProjection(item: LabProjectionSource): WorklistLabProjection {
  return {
    pipelineStage: item.pipelineStage ?? undefined,
    attentionReason: item.attentionReason ?? null,
    attentionLabel: item.attentionLabel ?? null,
    statusPresentation: item.statusPresentation ?? null,
    denyReason: item.denyReason ?? null,
    denyMessage: item.denyMessage ?? null,
    allowedActions: item.allowedActions,
  };
}
