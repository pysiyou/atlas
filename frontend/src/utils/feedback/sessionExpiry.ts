/**
 * Session-expiry latch so 401 handling toasts once (auth store), not again from mutation onError.
 */

let sessionExpired = false;

export function markSessionExpired(): void {
  sessionExpired = true;
}

export function clearSessionExpired(): void {
  sessionExpired = false;
}

export function isSessionExpired(): boolean {
  return sessionExpired;
}
