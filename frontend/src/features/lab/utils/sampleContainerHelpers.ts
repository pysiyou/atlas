/**
 * Infer cup vs tube when the collected sample did not store a container type.
 */

export const getEffectiveContainerType = (
  actualContainerType: string | undefined,
  sampleType: string
): 'cup' | 'tube' => {
  if (actualContainerType === 'cup' || actualContainerType === 'tube') {
    return actualContainerType;
  }
  return sampleType === 'urine' || sampleType === 'stool' ? 'cup' : 'tube';
};
