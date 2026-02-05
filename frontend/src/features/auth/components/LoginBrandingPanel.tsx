/**
 * LoginBrandingPanel Component
 * Left panel displaying branding, features, and trust indicators
 */

import React from 'react';
import { Icon } from '@/shared/ui';
import { ICONS } from '@/utils';
import { companyConfig } from '@/config';

interface LoginBrandingPanelProps {
  isVisible: boolean;
}

/**
 * LoginBrandingPanel Component
 * Displays the branding panel on the left side of the login page
 */
export const LoginBrandingPanel: React.FC<LoginBrandingPanelProps> = ({ isVisible }) => {
  const company = companyConfig.getConfig();
  const features = companyConfig.getFeatures();

  return (
    <div
      className={`hidden lg:flex flex-col items-start text-auth-fg space-y-10 flex-1 max-w-lg transition-all duration-1000 delay-200 ${
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
            <h1 className="font-display text-5xl text-auth-fg tracking-tight">{company.company.name}</h1>
            <p className="font-body text-auth-fg-light text-sm tracking-widest uppercase mt-1">
              {company.company.subtitle}
            </p>
          </div>
        </div>

        {/* Tagline */}
        <p className="font-body text-xl text-auth-fg-muted leading-relaxed max-w-md">
          {company.company.tagline}
        </p>
      </div>

      {/* Feature highlights */}
      <div className="space-y-5 w-full">
        {features.map((feature, index) => (
          <div
            key={feature.title}
            className={`group flex items-start gap-4 p-4 rounded-xl bg-auth-card border border-auth-card-stroke hover:bg-auth-card-hover hover:border-auth-card-stroke transition-all duration-300 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
            }`}
            style={{ transitionDelay: `${400 + index * 100}ms` }}
          >
            {/* Feature icon */}
            <div className="w-10 h-10 rounded-lg bg-auth-card-icon border border-auth-card-icon-border flex items-center justify-center flex-shrink-0 group-hover:bg-auth-card-icon-hover transition-colors duration-300">
              <Icon name={ICONS.actions.checkCircle} className="w-5 h-5 text-auth-fg-light" />
            </div>
            <div>
              <h3 className="font-body font-semibold text-auth-fg text-[15px] leading-tight">
                {feature.title}
              </h3>
              <p className="font-body text-sm text-auth-fg-muted mt-1 leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Trust indicators */}
      <div className="pt-6 border-t border-auth-stroke w-full">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-auth-badge border-2 border-auth-badge-border flex items-center justify-center"
              >
                <Icon name={ICONS.dataFields.user} className="w-4 h-4 text-auth-badge-icon" />
              </div>
            ))}
          </div>
          <p className="font-body text-sm text-auth-fg-muted">
            {company.marketing.trustIndicator.text}{' '}
            <span className="text-auth-fg-light font-semibold">{company.marketing.trustIndicator.count}</span>{' '}
            {company.marketing.trustIndicator.audience}
          </p>
        </div>
      </div>
    </div>
  );
};
