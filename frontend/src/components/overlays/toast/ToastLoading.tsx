/**
 * ToastLoading.tsx — Loading toast that persists until replaced.
 */

import React from 'react';
import { Toast } from './Toast';
import type { ToastProps } from './toastTypes';

export const ToastLoading: React.FC<ToastProps> = props => (
  <Toast variant="loading" persist showCountdown={false} {...props} />
);
