/**
 * useLoginForm Hook
 *
 * Manages login and first-administrator setup: status, validation, and submission.
 */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/app/authStore';
import { ROUTES } from '@/app/routes';
import { authAPI, isApiError } from '@/lib/api';

import { getFeedback } from '@/feedback';
import { getLoginErrorMessage } from '@/utils/errors';

/**
 * Login / first-admin form state and submit handlers.
 */
export const useLoginForm = () => {
  const navigate = useNavigate();
  const { login, setupFirstAdmin } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null);

  const usernameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    usernameInputRef.current?.focus();
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    authAPI
      .getSetupStatus()
      .then(status => {
        if (!cancelled) setSetupRequired(status.required);
      })
      .catch(err => {
        if (cancelled) return;
        setSetupRequired(false);
        setError(getLoginErrorMessage(err, getFeedback('auth.setup.statusFailed').title));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (setupRequired) {
      if (!displayName.trim() || !username.trim() || !password) {
        setError(getFeedback('auth.setup.fieldsRequired').title);
        return;
      }
    } else if (!username || !password) {
      setError(getFeedback('auth.login.fieldsRequired').title);
      return;
    }

    setIsSubmitting(true);

    try {
      if (setupRequired) {
        await setupFirstAdmin({
          name: displayName.trim(),
          username: username.trim(),
          password,
        });
      } else {
        await login(username, password);
      }
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      if (isApiError(err) && err.status === 409) {
        setSetupRequired(false);
        setError(getFeedback('auth.setup.alreadyCompleted').title);
      } else {
        setError(
          getLoginErrorMessage(
            err,
            setupRequired
              ? getFeedback('auth.setup.failed').title
              : getFeedback('auth.login.failed').title
          )
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    username,
    password,
    displayName,
    error,
    isSubmitting,
    showPassword,
    isVisible,
    setupRequired,
    usernameInputRef,
    setUsername,
    setPassword,
    setDisplayName,
    handleSubmit,
    togglePasswordVisibility: () => setShowPassword(prev => !prev),
    clearError: () => setError(''),
  };
};
