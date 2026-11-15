/**
 * LoginForm Component
 * Modern, professional login page with sophisticated clinical aesthetic.
 * Features refined glassmorphism, elegant typography, and subtle animations.
 * Uses useLoginForm hook for all form logic to avoid duplication.
 */

import { useRef } from 'react';
import { useLoginForm } from './useLoginForm';
import { LoginBackground } from './LoginBackground';
import { LoginBrandingPanel } from './LoginBrandingPanel';
import { LoginFormCard } from './LoginFormCard';

/**
 * Main LoginForm component
 * Renders the complete login page with branding, form, and background effects
 * PublicRoute component handles redirecting authenticated users
 */
export function LoginPage() {
  // Use the hook for all form logic
  const {
    username,
    password,
    displayName,
    error,
    isSubmitting,
    showPassword,
    isVisible,
    setupRequired,
    setUsername,
    setPassword,
    setDisplayName,
    handleSubmit,
    togglePasswordVisibility,
    clearError,
  } = useLoginForm();

  // Refs for DOM elements
  const formContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-promo-canvas flex items-center justify-center p-space-4 sm:p-space-6 lg:p-space-8 relative overflow-hidden">
      <LoginBackground />

      {/* Main content container */}
      <div
        ref={formContainerRef}
        className={`w-full max-w-6xl flex items-center justify-center lg:justify-between gap-space-8 lg:gap-space-16 relative z-10 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <LoginBrandingPanel isVisible={isVisible} />

        <LoginFormCard
          username={username}
          password={password}
          displayName={displayName}
          error={error}
          isSubmitting={isSubmitting}
          showPassword={showPassword}
          isVisible={isVisible}
          setupRequired={setupRequired}
          onUsernameChange={setUsername}
          onPasswordChange={setPassword}
          onDisplayNameChange={setDisplayName}
          onTogglePasswordVisibility={togglePasswordVisibility}
          onSubmit={handleSubmit}
          onErrorDismiss={clearError}
        />
      </div>
    </div>
  );
}
