/**
 * ToastWarning.tsx — Warning toast (stays until dismissed).
 */

import React from 'react';
import { Toast } from './Toast';
import type { ToastProps } from './toastTypes';

export const ToastWarning: React.FC<ToastProps> = props => <Toast variant="warning" {...props} />;
