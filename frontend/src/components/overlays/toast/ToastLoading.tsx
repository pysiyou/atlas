/**
 * ToastLoading.tsx — Loading toast (stays until replaced or dismissed).
 */

import React from 'react';
import { Toast } from './Toast';
import type { ToastProps } from './toastTypes';

export const ToastLoading: React.FC<ToastProps> = props => <Toast variant="loading" {...props} />;
