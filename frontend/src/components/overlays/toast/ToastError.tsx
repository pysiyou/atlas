/**
 * ToastError.tsx — Error toast (stays until dismissed).
 */

import React from 'react';
import { Toast } from './Toast';
import type { ToastProps } from './toastTypes';

export const ToastError: React.FC<ToastProps> = props => <Toast variant="error" {...props} />;
