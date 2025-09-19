'use client';

import { useState, useEffect } from 'react';
import { TenantConfig } from '@/lib/config';

export function useConfig(): {
  config: TenantConfig | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/config');
      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.status}`);
      }
      
      const configData = await response.json();
      setConfig(configData);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return { config, loading, error, refetch: fetchConfig };
}

export function useTheme() {
  const { config } = useConfig();
  
  return {
    accent: config?.theme?.accent || '#7c3aed',
    mode: config?.theme?.mode || 'dark',
    background: config?.theme?.background,
    primary: config?.theme?.primary,
    secondary: config?.theme?.secondary,
  };
}

export function useFeatures() {
  const { config } = useConfig();
  
  return {
    ticketing: config?.features?.ticketing ?? true,
    chat: config?.features?.chat ?? false,
    streaming: config?.features?.streaming ?? true,
    gallery: config?.features?.gallery ?? true,
    analytics: config?.features?.analytics ?? false,
  };
}

// Enhanced theme hook with real-time updates
export function useDynamicTheme() {
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('dark');
  const { config, refetch } = useConfig();

  // Update theme when config changes
  useEffect(() => {
    if (config?.theme?.mode && config.theme.mode !== 'auto') {
      setCurrentTheme(config.theme.mode);
    }
  }, [config?.theme?.mode]);

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(currentTheme);
    
    // Apply custom CSS variables from config
    if (config?.theme) {
      const style = document.documentElement.style;
      if (config.theme.accent) {
        style.setProperty('--theme-accent', config.theme.accent);
      }
      if (config.theme.background) {
        style.setProperty('--theme-background', config.theme.background);
      }
      if (config.theme.primary) {
        style.setProperty('--theme-primary', config.theme.primary);
      }
      if (config.theme.secondary) {
        style.setProperty('--theme-secondary', config.theme.secondary);
      }
    }
  }, [currentTheme, config?.theme]);

  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setCurrentTheme(newTheme);
  };

  const setTheme = (theme: 'light' | 'dark') => {
    setCurrentTheme(theme);
  };

  return {
    theme: currentTheme,
    toggleTheme,
    setTheme,
    accent: config?.theme?.accent || '#7c3aed',
    background: config?.theme?.background,
    primary: config?.theme?.primary,
    secondary: config?.theme?.secondary,
    refetchConfig: refetch,
  };
}
