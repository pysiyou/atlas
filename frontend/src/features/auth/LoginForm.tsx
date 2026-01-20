/**
 * LoginForm Component
 * Modern, professional login page with sophisticated clinical aesthetic.
 * Features refined glassmorphism, elegant typography, and subtle animations.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { ROUTES } from '@/config';
import { Icon } from '@/shared/ui';
import { AuthError } from './AuthProvider';

/**
 * Configuration for each floating icon element
 * Defines position, size, animation timing, and rotation
 */
interface FloatingIconConfig {
  /** Icon name (SVG filename without extension) */
  icon: string;
  /** CSS left position (percentage or pixels) */
  left: string;
  /** CSS top position (percentage or pixels) */
  top: string;
  /** Icon size in pixels */
  size: number;
  /** Animation delay in seconds */
  delay: number;
  /** Animation duration in seconds */
  duration: number;
  /** Initial rotation in degrees */
  rotation: number;
  /** Opacity value (0-1) */
  opacity: number;
}

/**
 * Predefined configurations for floating background icons
 * Each icon is used exactly once, distributed across the screen
 */
const FLOATING_ICONS_CONFIG: FloatingIconConfig[] = [
  // 13 unique icons spread across the entire screen
  { icon: 'microscope-landing-page', left: '5%', top: '8%', size: 120, delay: 0, duration: 12, rotation: -15, opacity: 0.22 },
  { icon: 'atom-landing-page', left: '50%', top: '5%', size: 110, delay: 2.5, duration: 14, rotation: 12, opacity: 0.2 },
  { icon: 'dna-landing-page', left: '92%', top: '12%', size: 115, delay: 1, duration: 13, rotation: -10, opacity: 0.21 },
  { icon: 'beaker-landing-page', left: '3%', top: '35%', size: 100, delay: 1.5, duration: 14, rotation: 8, opacity: 0.18 },
  { icon: 'thermometer-landing-page', left: '88%', top: '32%', size: 105, delay: 3, duration: 15, rotation: 15, opacity: 0.19 },
  { icon: 'drops-droplet-landing-page', left: '8%', top: '58%', size: 95, delay: 2.5, duration: 11, rotation: 5, opacity: 0.2 },
  { icon: 'bond-molecule-landing-page', left: '90%', top: '55%', size: 110, delay: 0.5, duration: 12, rotation: 22, opacity: 0.18 },
  { icon: 'test-tube-landing-page', left: '4%', top: '82%', size: 105, delay: 2, duration: 15, rotation: -25, opacity: 0.19 },
  { icon: 'flask-chemical-landing-page', left: '30%', top: '88%', size: 100, delay: 0, duration: 14, rotation: 18, opacity: 0.17 },
  { icon: 'vial-landing-page', left: '60%', top: '85%', size: 95, delay: 3.5, duration: 13, rotation: -12, opacity: 0.2 },
  { icon: 'syringe-landing-page', left: '92%', top: '80%', size: 90, delay: 1, duration: 16, rotation: 16, opacity: 0.18 },
  { icon: 'flask-education-landing-page', left: '18%', top: '18%', size: 85, delay: 4, duration: 13, rotation: -18, opacity: 0.16 },
  { icon: 'medicines-medicine-landing-page', left: '78%', top: '70%', size: 95, delay: 2, duration: 14, rotation: -6, opacity: 0.17 },
];

/**
 * FloatingIcon Component
 * Renders an animated floating SVG icon for background decoration
 */
const FloatingIcon: React.FC<FloatingIconConfig> = ({
  icon,
  left,
  top,
  size,
  delay,
  duration,
  rotation,
  opacity,
}) => (
  <div
    className="absolute pointer-events-none select-none"
    style={{
      left,
      top,
      width: size,
      height: size,
      opacity,
      transform: `rotate(${rotation}deg)`,
      animation: `floatIcon ${duration}s ease-in-out infinite`,
      animationDelay: `${delay}s`,
      filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
    }}
  >
    <img
      src={`/icons/${icon}.svg`}
      alt=""
      className="w-full h-full object-contain"
      style={{
        filter: 'brightness(0.8) saturate(0.7)',
      }}
      aria-hidden="true"
    />
  </div>
);

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
  const usernameInputRef = useRef<HTMLInputElement>(null);

  /**
   * Initialize component: trigger entrance animation and focus input
   */
  useEffect(() => {
    // Trigger entrance animations after mount
    const timer = setTimeout(() => setIsVisible(true), 100);

    // Auto-focus username input for better UX
    if (usernameInputRef.current) {
      usernameInputRef.current.focus();
    }

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
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* CSS Keyframes for custom animations */}
      <style>{`
        @keyframes floatIcon {
          0%, 100% { 
            transform: translateY(0) rotate(var(--rotation, 0deg)); 
          }
          25% { 
            transform: translateY(-15px) rotate(calc(var(--rotation, 0deg) + 3deg)); 
          }
          50% { 
            transform: translateY(-25px) rotate(calc(var(--rotation, 0deg) - 2deg)); 
          }
          75% { 
            transform: translateY(-10px) rotate(calc(var(--rotation, 0deg) + 2deg)); 
          }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1); opacity: 0.3; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient-shift 8s ease infinite;
        }
        .font-display {
          font-family: 'Nunito', sans-serif;
        }
        .font-body {
          font-family: 'Nunito', sans-serif;
        }
      `}</style>

      {/* ============================================
          BACKGROUND LAYER - Matte atmospheric effects
          ============================================ */}
      
      {/* Subtle matte color accents - flat, desaturated colors */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top-right muted teal accent */}
        <div 
          className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(94, 129, 138, 0.25) 0%, transparent 70%)',
          }}
        />
        {/* Bottom-left muted slate accent */}
        <div 
          className="absolute -bottom-48 -left-48 w-[600px] h-[600px] rounded-full opacity-25"
          style={{
            background: 'radial-gradient(circle, rgba(100, 116, 139, 0.2) 0%, transparent 70%)',
          }}
        />
        {/* Center subtle matte glow */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(120, 130, 150, 0.12) 0%, transparent 60%)',
          }}
        />
      </div>

      {/* Subtle grid pattern overlay - reduced for matte look */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating SVG icons for laboratory/medical atmosphere */}
      {FLOATING_ICONS_CONFIG.map((config, index) => (
        <FloatingIcon key={`${config.icon}-${index}`} {...config} />
      ))}

      {/* ============================================
          MAIN CONTENT CONTAINER
          ============================================ */}
      <div
        ref={formContainerRef}
        className={`w-full max-w-6xl flex items-center justify-center lg:justify-between gap-8 lg:gap-16 relative z-10 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* ============================================
            LEFT PANEL - Branding & Features (Matte styling)
            ============================================ */}
        <div 
          className={`hidden lg:flex flex-col items-start text-white space-y-10 flex-1 max-w-lg transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
          }`}
        >
          {/* Logo and brand name */}
          <div className="space-y-6">
            <div className="flex items-center gap-5">
              {/* Logo container with matte finish - subtle ring effect */}
              <div className="relative">
                <div 
                  className="absolute inset-0 rounded-lg bg-[#4a6670] blur-xl opacity-30"
                  style={{ animation: 'pulse-ring 3s ease-in-out infinite' }}
                />
                <div className="relative w-16 h-16 bg-[#3d5a66] rounded-lg flex items-center justify-center shadow-lg shadow-black/20 transform hover:scale-105 transition-transform duration-300">
                  <Icon name="app-logo" className="w-9 h-9" />
                </div>
              </div>
              <div>
                <h1 className="font-display text-5xl text-[#e8eaed] tracking-tight">
                  Atlas
                </h1>
                <p className="font-body text-[#7a9ba8] text-sm tracking-widest uppercase mt-1">
                  Clinical Labs
                </p>
              </div>
            </div>

            {/* Tagline */}
            <p className="font-body text-xl text-[#9ca3af] leading-relaxed max-w-md">
              Next-generation laboratory information system built for precision, 
              speed, and seamless clinical workflows.
            </p>
          </div>

          {/* Feature highlights with matte styling */}
          <div className="space-y-5 w-full">
            {[
              {
                title: 'Intelligent Patient Management',
                description: 'Unified records, appointments, and complete medical history at your fingertips',
              },
              {
                title: 'Streamlined Lab Workflows',
                description: 'From sample collection to result delivery — optimized every step of the way',
              },
              {
                title: 'Real-time Quality Control',
                description: 'Instant validation, automated alerts, and comprehensive audit trails',
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className={`group flex items-start gap-4 p-4 rounded-xl bg-[#232938] border border-[#2d3548] hover:bg-[#283040] hover:border-[#3d4760] transition-all duration-300 ${
                  isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                }`}
                style={{ transitionDelay: `${400 + index * 100}ms` }}
              >
                {/* Feature icon with matte teal */}
                <div className="w-10 h-10 rounded-lg bg-[#2d4550] border border-[#3d5a66] flex items-center justify-center flex-shrink-0 group-hover:bg-[#3a5663] transition-colors duration-300">
                  <Icon name="check-circle" className="w-5 h-5 text-[#7a9ba8]" />
                </div>
                <div>
                  <h3 className="font-body font-semibold text-[#e8eaed] text-[15px] leading-tight">
                    {feature.title}
                  </h3>
                  <p className="font-body text-sm text-[#8892a6] mt-1 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Trust indicators with matte styling */}
          <div className="pt-6 border-t border-[#2d3548] w-full">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-[#3a4556] border-2 border-[#1a1f2e] flex items-center justify-center"
                  >
                    <Icon name="user" className="w-4 h-4 text-[#8892a6]" />
                  </div>
                ))}
              </div>
              <p className="font-body text-sm text-[#8892a6]">
                Trusted by <span className="text-[#7a9ba8] font-semibold">500+</span> healthcare professionals
              </p>
            </div>
          </div>
        </div>

        {/* ============================================
            RIGHT PANEL - Login Form Card (Matte styling)
            ============================================ */}
        <div 
          className={`w-full max-w-xl lg:w-auto lg:min-w-[440px] transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
          }`}
        >
          {/* Card with matte finish - no glass effect */}
          <div className="relative">
            
            {/* Main card - solid matte background */}
            <div className="relative bg-[#232938] rounded-lg shadow-xl shadow-black/30 border border-[#2d3548] p-8 sm:p-10">
              {/* Subtle top accent line - matte teal */}
              <div className="absolute top-0 left-8 right-8 h-px bg-[#3d5a66]/50" />

              {/* Mobile logo - only shown on smaller screens */}
              <div className="flex lg:hidden items-center gap-3 mb-8">
                <div className="w-11 h-11 bg-[#3d5a66] rounded flex items-center justify-center shadow-md shadow-black/20">
                  <Icon name="app-logo" className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-2xl text-[#e8eaed]">Atlas</h1>
                  <p className="font-body text-[#7a9ba8] text-xs tracking-wider uppercase">Clinical Labs</p>
                </div>
              </div>

              {/* Form header */}
              <div className="mb-8">
                <h2 className="font-display text-3xl sm:text-4xl text-[#e8eaed] mb-2">
                  Welcome back
                </h2>
                <p className="font-body text-[#8892a6] text-[15px]">
                  Sign in to continue to your dashboard
                </p>
              </div>

              {/* Error message display - matte red */}
              {error && (
                <div className="mb-6 p-4 bg-[#3d2a2e] border border-[#5a3a40] rounded-lg animate-[shake_0.5s_ease-in-out]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#4a3035] flex items-center justify-center flex-shrink-0">
                      <Icon name="alert-circle" className="h-4 w-4 text-[#c9787e]" />
                    </div>
                    <p className="font-body text-sm text-[#d4989d]">{error}</p>
                  </div>
                </div>
              )}

              {/* Login form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Username field */}
                <div className="space-y-2">
                  <label 
                    htmlFor="username" 
                    className="block font-body text-sm font-medium text-[#b0b8c8]"
                  >
                    Username
                  </label>
                  <div className="relative group">
                    {/* Input icon */}
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <Icon 
                        name="user" 
                        className="h-5 w-5 text-[#6b7280] group-focus-within:text-[#7a9ba8] transition-colors duration-200" 
                      />
                    </div>
                    {/* Input field - matte styling */}
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
                      className="font-body block w-full pl-12 pr-4 py-3.5 bg-[#1a1f2e] border border-[#2d3548] rounded-lg text-[#e8eaed] placeholder-[#5c6478] focus:outline-none focus:ring-2 focus:ring-[#4a6670]/50 focus:border-[#4a6670] focus:bg-[#1e242f] transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                {/* Password field */}
                <div className="space-y-2">
                  <label 
                    htmlFor="password" 
                    className="block font-body text-sm font-medium text-[#b0b8c8]"
                  >
                    Password
                  </label>
                  <div className="relative group">
                    {/* Input icon */}
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <Icon 
                        name="lock" 
                        className="h-5 w-5 text-[#6b7280] group-focus-within:text-[#7a9ba8] transition-colors duration-200" 
                      />
                    </div>
                    {/* Input field - matte styling */}
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Enter your password"
                      className="font-body block w-full pl-12 pr-12 py-3.5 bg-[#1a1f2e] border border-[#2d3548] rounded-lg text-[#e8eaed] placeholder-[#5c6478] focus:outline-none focus:ring-2 focus:ring-[#4a6670]/50 focus:border-[#4a6670] focus:bg-[#1e242f] transition-all duration-200"
                      required
                    />
                    {/* Password visibility toggle */}
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#6b7280] hover:text-[#7a9ba8] transition-colors duration-200 z-10 cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <Icon name="eye" className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Submit button - matte teal, no gradient */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="relative w-full mt-2 font-body font-semibold py-4 px-6 rounded-lg text-white overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#4a6670]/50 focus:ring-offset-2 focus:ring-offset-[#232938]"
                >
                  {/* Button solid matte background - no gradient */}
                  <div className="absolute inset-0 bg-[#3d5a66] transition-all duration-300 group-hover:bg-[#4a6b78]" />
                  {/* Subtle shimmer effect on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-shimmer" />
                  {/* Button content */}
                  <span className="relative flex items-center justify-center">
                    {isSubmitting ? (
                      <>
                        <Icon name="loading" className="animate-spin -ml-1 mr-3 h-5 w-5" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </span>
                </button>
              </form>

              {/* Footer with copyright */}
              <div className="mt-8 pt-6 border-t border-[#2d3548]">
                <p className="font-body text-center text-sm text-[#6b7280]">
                  © 2026 Atlas Clinical Labs. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
