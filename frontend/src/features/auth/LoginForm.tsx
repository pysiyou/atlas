/**
 * LoginForm Component
 * Modern, professional login page with sophisticated clinical aesthetic.
 * Features refined glassmorphism, elegant typography, and subtle animations.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { ROUTES } from '@/config';
import { AuthError } from './AuthProvider';
import { LoginBackground } from './components/LoginBackground';
import { LoginBrandingPanel } from './components/LoginBrandingPanel';
import { LoginFormCard } from './components/LoginFormCard';

/**
 * Main LoginForm component
 * Renders the complete login page with branding, form, and background effects
 */
export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Form state management
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animation state for staggered entrance
  const [isVisible, setIsVisible] = useState(false);

  // Refs for DOM elements
  const formContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Initialize component: trigger entrance animation
   */
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Handle form submission
   * Validates inputs and attempts authentication
   * Handles different error types with appropriate user messaging
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await login(username, password);

      if (success) {
        navigate(ROUTES.DASHBOARD);
      }
    } catch (err) {
      // Handle AuthError with specific error codes
      if (err instanceof AuthError) {
        switch (err.code) {
          case 'INVALID_CREDENTIALS':
            setError(err.message);
            break;
          case 'NETWORK_ERROR':
            setError(err.message);
            break;
          case 'TIMEOUT':
            setError(err.message);
            break;
          case 'SERVER_ERROR':
            setError(err.message);
            break;
          default:
            setError(err.message || 'An unexpected error occurred. Please try again.');
        }
      } else if (err instanceof Error) {
        // Handle generic Error objects
        const errorMessage = err.message?.toLowerCase() || '';

        // Detect network/connection errors from generic Error messages
        if (
          errorMessage.includes('fetch') ||
          errorMessage.includes('network') ||
          errorMessage.includes('failed to fetch') ||
          errorMessage.includes('connection') ||
          errorMessage === 'load failed'
        ) {
          setError('Unable to connect to the server. Please check if the server is running.');
        } else if (errorMessage.includes('abort') || errorMessage.includes('timeout')) {
          setError('Request timed out. Please check your connection and try again.');
        } else {
          setError('An error occurred during login. Please try again.');
        }
      } else {
        // Fallback for unknown error types
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
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
          onErrorDismiss={() => setError('')}
        />
      </div>
    </div>
  );
};
