import { useContext } from 'react';
import { SamplesContext } from './SamplesContext';

export const useSamples = () => {
  const context = useContext(SamplesContext);
  if (!context) {
    throw new Error('useSamples must be used within SamplesProvider');
  }
  return context;
};
