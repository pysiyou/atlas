/** Surface fills and wells. */

import { TONE } from './tone';

export const SURFACE = {
  raised: 'bg-surface border border-border-default',
  recessed: 'bg-surface-page border border-border-default',
  dangerWell: TONE.danger.well,
  successWell: TONE.success.well,
  warningWell: TONE.warning.well,
  infoWell: TONE.info.well,
} as const;
