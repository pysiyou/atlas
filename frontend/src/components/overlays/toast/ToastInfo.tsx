/**
 * ToastInfo.tsx — Informational toast with countdown.
 */

import React from 'react';
import { Toast } from './Toast';
import { TOAST_DEFAULT_DURATION_MS } from './toastHelpers';
import type { ToastProps } from './toastTypes';

export const ToastInfo: React.FC<ToastProps> = props => (
  <Toast
    variant="info"
    persist={false}
    showCountdown
    durationMs={TOAST_DEFAULT_DURATION_MS}
    {...props}
  />
);
