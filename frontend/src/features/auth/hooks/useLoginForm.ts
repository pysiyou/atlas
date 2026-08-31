/**
 * useLoginForm Hook
 *
 * Manages login form state, validation, and submission.
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/app/store';
import { ROUTES } from '@/config';

import { getLoginErrorMessage } from '@/utils/errors';
export const useLoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

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
      setError(getLoginErrorMessage(err));
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
