/**
 * ToastInfo.tsx — Informational toast (auto-dismiss handled by react-hot-toast).
 */

import React from 'react';
import { Toast } from './Toast';
import type { ToastProps } from './toastTypes';

export const ToastInfo: React.FC<ToastProps> = props => <Toast variant="info" {...props} />;
