import type { VennSegment } from '../components/VennBubbles';

/** Create standard lab operation segments for VennBubbles */
export function createLabSegments(
  samplingPct: number,
  entryPct: number,
  validationPct: number
): VennSegment[] {
  return [
    {
      id: 'sampling',
      label: 'Sampling',
      value: samplingPct,
      color: '#5b7ff8',
    },
    {
      id: 'entry',
      label: 'Entry',
      value: entryPct,
      color: '#1e5a99',
      gradientEnd: '#2d7bc4',
    },
    {
      id: 'validation',
      label: 'Validation',
      value: validationPct,
      color: '#7c3aed',
      gradientEnd: '#9461fb',
    },
  ];
}
