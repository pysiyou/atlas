/**
 * LoginBrandingPanel Component
 * Left panel displaying branding, features, and trust indicators
 */

import React from 'react';
import { Icon } from '@/shared/ui';
import { ICONS } from '@/utils';

interface LoginBrandingPanelProps {
  isVisible: boolean;
}

/**
 * LoginBrandingPanel Component
 * Displays the branding panel on the left side of the login page
 */
export const LoginBrandingPanel: React.FC<LoginBrandingPanelProps> = ({ isVisible }) => {
  const features = [
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
  ];

  return (
    <div
      className={`hidden lg:flex flex-col items-start text-white space-y-10 flex-1 max-w-lg transition-all duration-1000 delay-200 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
      }`}
    >
      {/* Logo and brand name */}
      <div className="space-y-6">
        <div className="flex items-center gap-5">
          {/* Logo container with matte finish */}
          <div className="relative">
            <div
              className="absolute inset-0 rounded-lg bg-auth-accent-medium blur-xl opacity-30"
              style={{ animation: 'pulse-ring 3s ease-in-out infinite' }}
            />
            <div className="relative w-16 h-16 bg-auth-accent rounded-lg flex items-center justify-center shadow-lg shadow-black/20 transform hover:scale-105 transition-transform duration-300">
              <Icon name={ICONS.ui.appLogo} className="w-9 h-9" />
            </div>
          </div>
          <div>
            <h1 className="font-display text-5xl text-auth-text-primary tracking-tight">Atlas</h1>
            <p className="font-body text-auth-text-light text-sm tracking-widest uppercase mt-1">
              Clinical Labs
            </p>
          </div>
        </div>

        {/* Tagline */}
        <p className="font-body text-xl text-auth-text-muted leading-relaxed max-w-md">
          Next-generation laboratory information system built for precision, speed, and seamless
          clinical workflows.
        </p>
      </div>

      {/* Feature highlights */}
      <div className="space-y-5 w-full">
        {features.map((feature, index) => (
          <div
            key={feature.title}
            className={`group flex items-start gap-4 p-4 rounded-xl bg-auth-feature-card-bg border border-auth-feature-card-border hover:bg-auth-feature-card-hover hover:border-auth-feature-card-border-hover transition-all duration-300 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
            }`}
            style={{ transitionDelay: `${400 + index * 100}ms` }}
          >
            {/* Feature icon */}
            <div className="w-10 h-10 rounded-lg bg-auth-feature-card-icon-bg border border-auth-feature-card-icon-border flex items-center justify-center flex-shrink-0 group-hover:bg-auth-feature-card-icon-bg-hover transition-colors duration-300">
              <Icon name={ICONS.actions.checkCircle} className="w-5 h-5 text-auth-text-light" />
            </div>
            <div>
              <h3 className="font-body font-semibold text-auth-text-primary text-[15px] leading-tight">
                {feature.title}
              </h3>
              <p className="font-body text-sm text-auth-text-secondary mt-1 leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Trust indicators */}
      <div className="pt-6 border-t border-auth-border w-full">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-auth-user-badge-bg border-2 border-auth-user-badge-border flex items-center justify-center"
              >
                <Icon name={ICONS.dataFields.user} className="w-4 h-4 text-auth-user-badge-icon" />
              </div>
            ))}
          </div>
          <p className="font-body text-sm text-auth-text-secondary">
            Trusted by <span className="text-auth-text-light font-semibold">500+</span> healthcare
            professionals
          </p>
        </div>
      </div>
    </div>
  );
};
