import { useContext } from 'react';
import { AliquotsContext } from './AliquotsContext';

export const useAliquots = () => {
  const context = useContext(AliquotsContext);
  if (!context) {
    throw new Error('useAliquots must be used within AliquotsProvider');
  }
  return context;
};
