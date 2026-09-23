/**
 * LoginFormCard Component
 * The login form card with input fields and submit button
 */

import React, { useRef, useEffect } from 'react';
import { Icon, SpinnerLoader } from '@/components';
import { ICONS } from '@/config/icons';
import { companyConfig } from '@/config';
import { AUTH_CONTROL, AUTH_SHADOW, RADIUS } from '@/components/theme/recipes';

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
  const company = companyConfig.getConfig();
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
        <div className={`relative bg-auth-panel ${RADIUS.menu} ${AUTH_SHADOW.card} border border-auth-stroke p-space-8 sm:p-space-10`}>
          {/* Subtle top accent line */}
          <div className="absolute top-0 left-space-8 right-space-8 h-px bg-auth-accent-medium/50" />

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-space-3 mb-space-8">
            <div className={`w-11 h-11 bg-auth-accent ${RADIUS.field} flex items-center justify-center ${AUTH_SHADOW.logo}`}>
              <Icon name={ICONS.ui.appLogo} className="w-6 h-6 text-auth-fg" />
            </div>
            <div>
              <h1 className="font-display text-2xl text-auth-fg">{company.company.name}</h1>
              <p className="font-body text-auth-fg-light text-xs tracking-wider uppercase">
                {company.company.subtitle}
              </p>
            </div>
          </div>

          {/* Form header */}
          <div className="mb-space-8">
            <h2 className="font-display text-3xl sm:text-4xl text-auth-fg mb-space-2">Welcome back</h2>
            <p className="font-body text-auth-fg-muted text-sm">
              Sign in to continue to your dashboard
            </p>
          </div>

          {/* Error message display */}
          {error && (
            <div className={`mb-space-6 p-panel bg-auth-error border border-auth-error-stroke ${RADIUS.menu} animate-[shake_0.5s_ease-in-out]`}>
              <div className="flex items-center gap-space-3">
                <div className={`w-8 h-8 ${RADIUS.menu} bg-auth-error-muted flex items-center justify-center flex-shrink-0`}>
                  <Icon name={ICONS.actions.alertCircle} className="h-4 w-4 text-auth-error-fg" />
                </div>
                <p className="font-body text-sm text-auth-error-fg">{error}</p>
              </div>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={onSubmit} className="space-y-space-5">
            {/* Username field */}
            <div className="space-y-space-2">
              <label
                htmlFor="username"
                className="block font-body text-sm font-normal text-auth-fg-muted"
              >
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-space-4 flex items-center pointer-events-none z-10">
                  <Icon
                    name={ICONS.dataFields.user}
                    className="h-5 w-5 text-auth-fg-subtle group-focus-within:text-auth-fg-light transition-colors duration-200"
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
                  className={`font-body block w-full pl-space-12 pr-space-4 py-space-3-5 bg-auth-input border border-auth-input-stroke ${RADIUS.menu} text-auth-fg placeholder-auth-fg-subtle ${AUTH_CONTROL.focusField} hover:bg-auth-panel-hover transition-all duration-200`}
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-space-2">
              <label
                htmlFor="password"
                className="block font-body text-sm font-normal text-auth-fg-muted"
              >
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-space-4 flex items-center pointer-events-none z-10">
                  <Icon
                    name={ICONS.ui.lock}
                    className="h-5 w-5 text-auth-fg-subtle group-focus-within:text-auth-fg-light transition-colors duration-200"
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
                  className={`font-body block w-full pl-space-12 pr-space-12 py-space-3-5 bg-auth-input border border-auth-input-stroke ${RADIUS.menu} text-auth-fg placeholder-auth-fg-subtle ${AUTH_CONTROL.focusField} hover:bg-auth-panel-hover transition-all duration-200`}
                  required
                />
                <button
                  type="button"
                  onClick={onTogglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-space-4 flex items-center text-auth-fg-subtle hover:text-auth-fg-light transition-colors duration-200 z-10 cursor-pointer"
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
              className={`relative w-full mt-space-2 font-body font-normal py-space-4 px-table-cell-x-default ${RADIUS.menu} text-auth-fg overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-300 ${AUTH_CONTROL.focusSubmit}`}
            >
              <div className="absolute inset-0 bg-auth-accent transition-all duration-300 hover:bg-auth-accent-hover" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-shimmer" />
              <span className="relative flex items-center justify-center">
                {isSubmitting ? (
                  <span className="inline-flex shrink-0">
                    <SpinnerLoader size="xs" />
                  </span>
                ) : (
                  'Sign In'
                )}
              </span>
            </button>
          </form>

          {/* Footer */}
          <div className="mt-space-8 pt-space-6 border-t border-auth-stroke">
            <p className="font-body text-center text-sm text-auth-fg-subtle">
              {company.company.copyright}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
