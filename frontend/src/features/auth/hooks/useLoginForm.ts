/**
 * useLoginForm Hook
 * Handles login form state and submission logic
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { ROUTES } from '@/config';
import { AuthError } from '../AuthProvider';

export const useLoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Refs
  const usernameInputRef = useRef<HTMLInputElement>(null);

  // Initialize: trigger entrance animation and focus input
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    usernameInputRef.current?.focus();
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
      if (err instanceof AuthError) {
        setError(err.message);
      } else if (err instanceof Error) {
        const errorMessage = err.message?.toLowerCase() || '';
        if (
          errorMessage.includes('fetch') ||
          errorMessage.includes('network') ||
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
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(prev => !prev);

  const clearError = () => {
    if (error) setError('');
  };

  return {
    // State
    username,
    password,
    error,
    isSubmitting,
    showPassword,
    isVisible,
    // Refs
    usernameInputRef,
    // Actions
    setUsername,
    setPassword,
    handleSubmit,
    togglePasswordVisibility,
    clearError,
  };
};
