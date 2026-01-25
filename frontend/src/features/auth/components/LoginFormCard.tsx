/**
 * LoginFormCard Component
 * The login form card with input fields and submit button
 */

import React, { useRef, useEffect } from 'react';
import { Icon } from '@/shared/ui';
import { ICONS } from '@/utils/icon-mappings';
import { authColors } from '@/shared/design-system/tokens/colors';

interface LoginFormCardProps {
  username: string;
  password: string;
  error: string;
  isSubmitting: boolean;
  showPassword: boolean;
  isVisible: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePasswordVisibility: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onErrorDismiss: () => void;
}

/**
 * LoginFormCard Component
 * Renders the login form card with all input fields and controls
 */
// Large component is necessary for comprehensive login form with validation, error handling, and multiple input fields
// eslint-disable-next-line max-lines-per-function
export const LoginFormCard: React.FC<LoginFormCardProps> = ({
  username,
  password,
  error,
  isSubmitting,
  showPassword,
  isVisible,
  onUsernameChange,
  onPasswordChange,
  onTogglePasswordVisibility,
  onSubmit,
  onErrorDismiss,
}) => {
  const usernameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus username input for better UX
    if (usernameInputRef.current) {
      usernameInputRef.current.focus();
    }
  }, []);

  return (
    <div
      className={`w-full max-w-xl lg:w-auto lg:min-w-[440px] transition-all duration-1000 delay-300 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
      }`}
    >
      <div className="relative">
        {/* Main card */}
        <div className={`relative ${authColors.backgroundSecondary} rounded-lg shadow-xl shadow-black/30 ${authColors.border.default} p-8 sm:p-10`}>
          {/* Subtle top accent line */}
          <div className={`absolute top-0 left-8 right-8 h-px ${authColors.accentBlur}/50`} />

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className={`w-11 h-11 ${authColors.accent} rounded flex items-center justify-center shadow-md shadow-black/20`}>
              <Icon name={ICONS.ui.appLogo} className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`font-display text-2xl ${authColors.text.primary}`}>Atlas</h1>
              <p className={`font-body ${authColors.text.light} text-xs tracking-wider uppercase`}>
                Clinical Labs
              </p>
            </div>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <h2 className={`font-display text-3xl sm:text-4xl ${authColors.text.primary} mb-2`}>Welcome back</h2>
            <p className={`font-body ${authColors.text.tertiary} text-[15px]`}>
              Sign in to continue to your dashboard
            </p>
          </div>

          {/* Error message display */}
          {error && (
            <div className={`mb-6 p-4 ${authColors.error.background} ${authColors.error.border} rounded-lg animate-[shake_0.5s_ease-in-out]`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${authColors.error.backgroundLight} flex items-center justify-center flex-shrink-0`}>
                  <Icon name={ICONS.actions.alertCircle} className={`h-4 w-4 ${authColors.error.icon}`} />
                </div>
                <p className={`font-body text-sm ${authColors.error.text}`}>{error}</p>
              </div>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={onSubmit} className="space-y-5">
            {/* Username field */}
            <div className="space-y-2">
              <label
                htmlFor="username"
                className={`block font-body text-sm font-medium ${authColors.text.secondary}`}
              >
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <Icon
                    name={ICONS.dataFields.user}
                    className={`h-5 w-5 ${authColors.text.muted} group-focus-within:${authColors.text.light} transition-colors duration-200`}
                  />
                </div>
                <input
                  ref={usernameInputRef}
                  id="username"
                  type="text"
                  value={username}
                  onChange={e => {
                    onUsernameChange(e.target.value);
                    onErrorDismiss();
                  }}
                  placeholder="Enter your username"
                  className={`font-body block w-full pl-12 pr-4 py-3.5 ${authColors.background} ${authColors.border.default} rounded-lg ${authColors.text.primary} ${authColors.text.placeholder} focus:outline-none focus:ring-2 ${authColors.focusRing} ${authColors.border.focus} ${authColors.backgroundTertiary} transition-all duration-200`}
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className={`block font-body text-sm font-medium ${authColors.text.secondary}`}
              >
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <Icon
                    name={ICONS.ui.lock}
                    className={`h-5 w-5 ${authColors.text.muted} group-focus-within:${authColors.text.light} transition-colors duration-200`}
                  />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => {
                    onPasswordChange(e.target.value);
                    onErrorDismiss();
                  }}
                  placeholder="Enter your password"
                  className={`font-body block w-full pl-12 pr-12 py-3.5 ${authColors.background} ${authColors.border.default} rounded-lg ${authColors.text.primary} ${authColors.text.placeholder} focus:outline-none focus:ring-2 ${authColors.focusRing} ${authColors.border.focus} ${authColors.backgroundTertiary} transition-all duration-200`}
                  required
                />
                <button
                  type="button"
                  onClick={onTogglePasswordVisibility}
                  className={`absolute inset-y-0 right-0 pr-4 flex items-center ${authColors.text.muted} hover:${authColors.text.light} transition-colors duration-200 z-10 cursor-pointer`}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon name={ICONS.actions.view} className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`relative w-full mt-2 font-body font-semibold py-4 px-6 rounded-lg text-white overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 ${authColors.focusRing} focus:ring-offset-2 ${authColors.focusRingOffset}`}
            >
              <div className={`absolute inset-0 ${authColors.accent} transition-all duration-300 ${authColors.accentHover}`} />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-shimmer" />
              <span className="relative flex items-center justify-center">
                {isSubmitting ? (
                  <>
                    <Icon name={ICONS.actions.loading} className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </span>
            </button>
          </form>

          {/* Footer */}
          <div className={`mt-8 pt-6 border-t ${authColors.border.default}`}>
            <p className={`font-body text-center text-sm ${authColors.text.muted}`}>
              © 2026 Atlas Clinical Labs. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
