/**
 * LoginForm Component
 * Modern, professional login page with sophisticated clinical aesthetic.
 * Features refined glassmorphism, elegant typography, and subtle animations.
 * Uses useLoginForm hook for all form logic to avoid duplication.
 */

import React, { useRef } from 'react';
import { useLoginForm } from './hooks/useLoginForm';
import { LoginBackground } from './components/LoginBackground';
import { LoginBrandingPanel } from './components/LoginBrandingPanel';
import { LoginFormCard } from './components/LoginFormCard';

/**
 * Main LoginForm component
 * Renders the complete login page with branding, form, and background effects
 * PublicRoute component handles redirecting authenticated users
 */
export const LoginForm: React.FC = () => {
  // Use the hook for all form logic
  const {
    username,
    password,
    error,
    isSubmitting,
    showPassword,
    isVisible,
    setUsername,
    setPassword,
    handleSubmit,
    togglePasswordVisibility,
    clearError,
  } = useLoginForm();

  // Refs for DOM elements
  const formContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-auth-bg flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      <LoginBackground />

      {/* Main content container */}
      <div
        ref={formContainerRef}
        className={`w-full max-w-6xl flex items-center justify-center lg:justify-between gap-8 lg:gap-16 relative z-10 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <LoginBrandingPanel isVisible={isVisible} />

        <LoginFormCard
          username={username}
          password={password}
          error={error}
          isSubmitting={isSubmitting}
          showPassword={showPassword}
          isVisible={isVisible}
          onUsernameChange={setUsername}
          onPasswordChange={setPassword}
          onTogglePasswordVisibility={togglePasswordVisibility}
          onSubmit={handleSubmit}
          onErrorDismiss={clearError}
        />
      </div>
    </div>
  );
};
