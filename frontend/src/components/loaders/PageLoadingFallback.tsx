/**
 * Shared full-screen loading fallback for route transitions and auth gates.
 */

import React from 'react';
import { LoadingState } from './LoadingState';

export const PageLoadingFallback: React.FC = () => (
  <LoadingState message="Loading..." fullScreen size="lg" />
);
