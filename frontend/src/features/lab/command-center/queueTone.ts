import type { CommandCenterKpiTone } from './components/styles';
import type { QueueAgeStats } from './boardTypes';

export function queueTileTone(count: number, age: QueueAgeStats): CommandCenterKpiTone {
  if (count === 0) return 'neutral';
  if (age.criticalCount > 0) return 'danger';
  if (age.warningCount > 0) return 'warning';
  return 'brand';
}
