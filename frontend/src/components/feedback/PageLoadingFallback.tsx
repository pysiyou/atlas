/**
 * Shared full-screen loading fallback for route transitions and auth gates.
 */

import React from 'react';
import { LoadingState } from './LoadingState';

/** Full-screen fallback for auth bootstrap and public routes (no app shell). */
export const PageLoadingFallback: React.FC = () => (
  <LoadingState message="Loading..." fullScreen size="lg" />
);

/** Fills the app shell content pane during lazy route chunk loads. */
export const PageContentLoadingFallback: React.FC = () => (
  <div className="flex flex-1 min-h-0 items-center justify-center">
    <LoadingState message="Loading..." size="lg" />
  </div>
);
