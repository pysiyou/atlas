/**
 * useLoginForm Hook
 *
 * Manages login form state, validation, and submission.
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { ROUTES } from '@/config';

const getErrorMessage = (err: unknown): string => {
  if (!(err instanceof Error)) {
    return 'An unexpected error occurred';
  }

  const msg = err.message.toLowerCase();

  // Network errors
  if (msg.includes('fetch') || msg.includes('network') || msg === 'load failed') {
    return 'Unable to connect to server. Please check your connection.';
  }

  // Timeout
  if (msg.includes('abort') || msg.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  // Auth errors from API (401, 403)
  if (msg.includes('invalid') || msg.includes('unauthorized')) {
    return 'Invalid username or password';
  }

  return err.message || 'Login failed. Please try again.';
};

export const useLoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const usernameInputRef = useRef<HTMLInputElement>(null);

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
      await login(username, password);
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    username,
    password,
    error,
    isSubmitting,
    showPassword,
    isVisible,
    usernameInputRef,
    setUsername,
    setPassword,
    handleSubmit,
    togglePasswordVisibility: () => setShowPassword(prev => !prev),
    clearError: () => setError(''),
  };
};
