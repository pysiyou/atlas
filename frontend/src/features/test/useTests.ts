import { useContext } from 'react';
import { TestsContext } from './TestsContext';

export const useTests = () => {
  const context = useContext(TestsContext);
  if (!context) {
    throw new Error('useTests must be used within TestsProvider');
  }
  return context;
};
