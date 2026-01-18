/**
 * LoginForm Component
 * Enhanced login page with modern design elements
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { ROUTES } from '@/config';
import { Icon } from '@/shared/ui';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const formContainerRef = useRef<HTMLDivElement>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (usernameInputRef.current) {
      usernameInputRef.current.focus();
    }
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
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-sky-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-sky-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItMnptMCAwdjJoLTJ2LTJoMnptLTIgMmgtMnYtMmgydjJ6bTAtMnYtMmgydjJoLTJ6bTItMnYtMmgydjJoLTJ6bS0yIDB2LTJoMnYyaC0yem0wLTJ2LTJoMnYyaC0yem0yIDB2LTJoMnYyaC0yem0wLTJ2LTJoMnYyaC0yem0tMiAwdi0yaDJ2MmgtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>

      <div
        ref={formContainerRef}
        className="w-full max-w-5xl flex items-center justify-center gap-12 relative z-10"
      >
        {/* Left side - Branding */}
        <div className="hidden lg:flex flex-col items-start text-white space-y-8 flex-1">
          <div>
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-blue-600 rounded-lg flex items-center justify-center shadow-2xl shadow-sky-500/50">
                <Icon name="app-logo" className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Atlas</h1>
                <p className="text-sky-200 text-sm">Clinical Labs</p>
              </div>
            </div>
            <p className="text-xl text-sky-100 leading-relaxed">
              Advanced Laboratory Management System for Modern Healthcare
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-sky-500/20 rounded-sm flex items-center justify-center flex-shrink-0 mt-1">
                <Icon name="check-circle" className="w-5 h-5 text-sky-300" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Comprehensive Patient Management</h3>
                <p className="text-sm text-sky-200 mt-1">Track patient records, appointments, and medical history</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-sky-500/20 rounded-sm flex items-center justify-center flex-shrink-0 mt-1">
                <Icon name="check-circle" className="w-5 h-5 text-sky-300" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Advanced Laboratory Workflows</h3>
                <p className="text-sm text-sky-200 mt-1">Streamlined sample collection and test processing</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-sky-500/20 rounded-sm flex items-center justify-center flex-shrink-0 mt-1">
                <Icon name="check-circle" className="w-5 h-5 text-sky-300" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Real-time Result Validation</h3>
                <p className="text-sm text-sky-200 mt-1">Instant quality control and result verification</p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-sky-500/20">
            <p className="text-sm text-sky-300">
              Trusted by healthcare professionals worldwide
            </p>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full lg:w-auto lg:min-w-[480px]">
          <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-2xl border border-white/20 p-10">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-600">Sign in to access your account</p>
            </div>

            {/* Display error if present */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                <div className="flex items-center">
                  <Icon name="alert-circle" className="h-5 w-5 text-red-500 mr-3" />
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username field */}
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-500 mb-2">
                  Username
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Icon name="user" className="h-5 w-5 text-gray-400 group-focus-within:text-sky-500 transition-colors" />
                  </div>
                  <input
                    ref={usernameInputRef}
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Enter your username"
                    className="block w-full pl-11 pr-4 py-3.5 border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                    required
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-500 mb-2">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Icon name="lock" className="h-5 w-5 text-gray-400 group-focus-within:text-sky-500 transition-colors" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Enter your password"
                    className="block w-full pl-11 pr-12 py-3.5 border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-sky-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Icon name="eye" className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <Icon name="loading" className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-500">
                © 2026 Atlas Clinical Labs. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
