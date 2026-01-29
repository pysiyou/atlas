/**
 * Typed wrapper around react-hot-toast so message can be string | ToastMessageObject.
 * AppToastBar resolves ToastMessageObject (title/subtitle/actions) at render time.
 */

import toastLib from 'react-hot-toast';
import type { ToastMessageObject } from './AppToastBar';

type ToastMessage = React.ReactElement | string | null | ToastMessageObject;

export const toast = toastLib as Omit<typeof toastLib, 'success' | 'error' | 'loading' | 'custom'> & {
  (message: ToastMessage, opts?: Parameters<typeof toastLib>[1]): string;
  success(message: ToastMessage, opts?: Parameters<typeof toastLib.success>[1]): string;
  error(message: ToastMessage, opts?: Parameters<typeof toastLib.error>[1]): string;
  loading(message: ToastMessage, opts?: Parameters<typeof toastLib.loading>[1]): string;
  custom(message: ToastMessage, opts?: Parameters<typeof toastLib.custom>[1]): string;
};
