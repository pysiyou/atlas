/**
 * Client Configuration Loader
 * 
 * Loads white-label configuration at app startup and provides it via context
 */
import React, { useEffect, useState } from 'react';
import { loadClientConfig, applyBranding, type ClientConfig } from '@/config/clientConfig';
import { ClientConfigProvider } from '@/config/ClientConfigContext';
import { setThemeMode, type ThemeName } from '@/theme/theme';

type ConfigStatus = 'loading' | 'ready' | 'error';

interface ConfigLoaderProps {
  children: React.ReactNode;
}

export const ConfigLoader: React.FC<ConfigLoaderProps> = ({ children }) => {
  const [status, setStatus] = useState<ConfigStatus>('loading');
  const [config, setConfig] = useState<ClientConfig | null>(null);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    loadClientConfig()
      .then((loadedConfig) => {
        setConfig(loadedConfig);
        applyBranding(loadedConfig);
        
        // Apply default theme if specified in config
        if (loadedConfig.branding.defaultTheme) {
          const themeName = loadedConfig.branding.defaultTheme as ThemeName;
          const validThemes = ['studio-light', 'playful-light', 'aurora-light', 'github', 'noir-studio'];
          
          if (validThemes.includes(themeName)) {
            // Determine the mode from the theme name
            const isLightTheme = themeName.includes('light');
            const mode = isLightTheme ? 'light' : 'dark';
            
            // Only apply if no theme is already stored (first visit)
            if (!localStorage.getItem('atlas-theme')) {
              console.log(`Applying default theme from config: ${themeName} (${mode})`);
              setThemeMode(mode);
            }
          } else {
            console.warn(`Invalid theme in config: ${themeName}`);
          }
        }
        
        setStatus('ready');
      })
      .catch((err) => {
        console.error('Failed to load config:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus('error');
        // Still set a default config to allow app to continue
        const defaultConfig: ClientConfig = {
          company: {
            name: 'Atlas Lab',
            displayName: 'Atlas Lab',
          },
          branding: {
            logoPath: '/icons/here.svg',
            primaryColor: '#0284c7',
          },
          terminology: {},
          features: {},
          workflows: {},
        };
        setConfig(defaultConfig);
        applyBranding(defaultConfig);
      });
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-neutral-600">Loading configuration...</div>
      </div>
    );
  }

  return (
    <ClientConfigProvider config={config} status={status} error={error}>
      {children}
    </ClientConfigProvider>
  );
};
