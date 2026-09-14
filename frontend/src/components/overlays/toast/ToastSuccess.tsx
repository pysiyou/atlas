/**
 * ToastSuccess.tsx — Success toast with countdown and optional actions.
 */

import React from 'react';
import { Toast } from './Toast';
import { TOAST_DEFAULT_DURATION_MS } from './toastHelpers';
import type { ToastProps } from './toastTypes';

export const ToastSuccess: React.FC<ToastProps> = props => (
  <Toast
    variant="success"
    persist={false}
    showCountdown
    durationMs={TOAST_DEFAULT_DURATION_MS}
    {...props}
  />
);
