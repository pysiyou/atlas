/**
 * Token Refresh Utilities
 * Handles token refresh logic, request queueing, and expiration checking
 */

import { logger } from '@/utils/logger';

/**
 * Pending request that needs to be retried after token refresh
 */
export interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
  retry: () => Promise<unknown>;
}

/**
 * Request queue for managing concurrent requests during token refresh
 * Ensures only one refresh happens at a time and queues other requests
 */
export class TokenRefreshQueue {
  private refreshPromise: Promise<string> | null = null;
  private pendingRequests: PendingRequest[] = [];
  private isRefreshing = false;

  /**
   * Check if a token refresh is currently in progress
   */
  isRefreshInProgress(): boolean {
    return this.isRefreshing;
  }

  /**
   * Queue a request to be retried after token refresh completes
   * @param request - The pending request to queue
   */
  queueRequest(request: PendingRequest): void {
    this.pendingRequests.push(request);
  }

  /**
   * Start a token refresh operation
   * If a refresh is already in progress, returns the existing promise
   * @param refreshFn - Function that performs the token refresh
   * @returns Promise that resolves with the new access token
   */
  async startRefresh(refreshFn: () => Promise<string>): Promise<string> {
    // If refresh is already in progress, return the existing promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        logger.debug('Starting token refresh');
        const newToken = await refreshFn();
        logger.debug('Token refresh successful');

        // Retry all pending requests with the new token
        const requests = [...this.pendingRequests];
        this.pendingRequests = [];

        // Retry requests in parallel
        await Promise.allSettled(
          requests.map(async (req) => {
            try {
              const result = await req.retry();
              req.resolve(result);
            } catch (error) {
              req.reject(error);
            }
          })
        );

        return newToken;
      } catch (error) {
        logger.error('Token refresh failed', error instanceof Error ? error : undefined);

        // Reject all pending requests
        const requests = [...this.pendingRequests];
        this.pendingRequests = [];
        requests.forEach((req) => {
          req.reject(error);
        });

        throw error;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Clear the refresh queue and pending requests
   */
  clear(): void {
    this.pendingRequests.forEach((req) => {
      req.reject(new Error('Token refresh queue cleared'));
    });
    this.pendingRequests = [];
    this.refreshPromise = null;
    this.isRefreshing = false;
  }
}

/**
 * Decode JWT token to extract payload
 * @param token - JWT token string
 * @returns Decoded token payload or null if invalid
 */
export function decodeJWT(token: string): { exp?: number; iat?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch (error) {
    logger.warn('Failed to decode JWT token', error instanceof Error ? { error: error.message } : undefined);
    return null;
  }
}

/**
 * Check if a token is expired or will expire soon
 * @param token - JWT access token
 * @param bufferSeconds - Buffer time in seconds before expiration to consider token expired (default: 60)
 * @returns true if token is expired or will expire within buffer time
 */
export function isTokenExpired(token: string | null, bufferSeconds = 60): boolean {
  if (!token) {
    return true;
  }

  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) {
    // If we can't decode or no expiration, assume expired for safety
    return true;
  }

  const expirationTime = decoded.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const bufferTime = bufferSeconds * 1000;

  return expirationTime <= currentTime + bufferTime;
}

/**
 * Get the expiration time of a token in milliseconds
 * @param token - JWT access token
 * @returns Expiration time in milliseconds, or null if invalid
 */
export function getTokenExpiration(token: string | null): number | null {
  if (!token) {
    return null;
  }

  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) {
    return null;
  }

  return decoded.exp * 1000; // Convert to milliseconds
}

/**
 * Calculate when to proactively refresh a token
 * Refreshes when token is halfway through its lifetime
 * @param token - JWT access token
 * @returns Time in milliseconds until refresh should occur, or null if invalid
 */
export function getProactiveRefreshTime(token: string | null): number | null {
  if (!token) {
    return null;
  }

  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp || !decoded.iat) {
    return null;
  }

  const expirationTime = decoded.exp * 1000;
  const issuedTime = decoded.iat * 1000;
  const currentTime = Date.now();

  // Calculate token lifetime
  const tokenLifetime = expirationTime - issuedTime;

  // Refresh at halfway point, but not if already past that point
  const refreshTime = issuedTime + tokenLifetime / 2;

  if (refreshTime <= currentTime) {
    // Token is past halfway point, refresh soon (in 1 minute)
    return 60000;
  }

  return refreshTime - currentTime;
}
