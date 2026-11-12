/**
 * Client Configuration Loader
 * 
 * Loads white-label configuration at app startup
 */
import React, { useEffect, useState } from 'react';
import { loadClientConfig, applyBranding } from '@/config/clientConfig';

interface ConfigLoaderProps {
  children: React.ReactNode;
}

export const ConfigLoader: React.FC<ConfigLoaderProps> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadClientConfig()
      .then((config) => {
        applyBranding(config);
        setIsLoaded(true);
      })
      .catch((error) => {
        console.error('Failed to load config:', error);
        setIsLoaded(true); // Continue anyway with defaults
      });
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-neutral-600">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
};
