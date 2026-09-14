/**
 * ToastSuccess.tsx — Success toast (auto-dismiss handled by react-hot-toast).
 */

import React from 'react';
import { Toast } from './Toast';
import type { ToastProps } from './toastTypes';

export const ToastSuccess: React.FC<ToastProps> = props => <Toast variant="success" {...props} />;
